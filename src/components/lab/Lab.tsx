"use client";

import { LayoutGroup, MotionConfig } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useSound } from "@/components/site/Sound";
import { resolveTemplate, type PartKey, type TemplateDefinition } from "@/lib/lab/templates";
import { initialState, transition, type Command, type TemplateId } from "@/lib/lab/types";
import { MorphButton } from "./Header";
import { ModeControl } from "./ModeControl";
import { CodePane } from "./CodePane";
import { RenderPane } from "./RenderPane";
import type { MotionRun } from "./SharedPart";

const subscribeReady = () => () => {};
const getReady = () => true;
const getServerReady = () => false;
const initialRun: MotionRun = { generation: 0, epoch: 0, spatial: true, travelling: false, offscreen: false };

function visible(element: HTMLElement | null) {
  if (!element) return false;
  const box = element.getBoundingClientRect();
  return box.width > 0 && box.height > 0 && box.top >= 0 && box.left >= 0
    && box.bottom <= window.innerHeight && box.right <= window.innerWidth;
}

// One lab instance, locked to one template. Each chapter of the page mounts its own; they share nothing but the
// page-level sound preference (see components/site/Sound.tsx), and their layout identities are namespaced by useId.
export function Lab({ id, definition = null }: { id: TemplateId; definition?: TemplateDefinition | null }) {
  const namespace = useId();
  const ready = useSyncExternalStore(subscribeReady, getReady, getServerReady);
  const start = { ...initialState, activeTemplate: id };
  const [state, setState] = useState(start);
  const latest = useRef(start);
  const [announcement, setAnnouncement] = useState("");
  const sound = useSound();
  const [run, setRun] = useState(initialRun);
  const currentRun = useRef(initialRun);
  const pending = useRef(new Set<PartKey>());
  const codeContent = useRef<HTMLDivElement>(null);
  const renderContent = useRef<HTMLDivElement>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const frames = useRef<number[]>([]);
  const template = resolveTemplate(state.activeTemplate, definition);

  const applyRun = useCallback((next: MotionRun) => {
    currentRun.current = next;
    setRun(next);
  }, []);

  // A static commit discards old projection. Re-register identities only after
  // that endpoint has been painted; never remount the controls or pane frames.
  const settle = useCallback((offscreen = false) => {
    frames.current.forEach(cancelAnimationFrame);
    const next = { ...currentRun.current, generation: currentRun.current.generation + 1,
      epoch: currentRun.current.epoch + 1, spatial: false, travelling: false, offscreen };
    pending.current.clear();
    applyRun(next);
    frames.current = [requestAnimationFrame(() => {
      frames.current.push(requestAnimationFrame(() => {
        if (currentRun.current.generation === next.generation) applyRun({ ...next, spatial: true });
      }));
    })];
  }, [applyRun]);

  const command = (input: Command) => {
    const next = transition(latest.current, input);
    if (next === latest.current) return;
    latest.current = next;
    if (input.type === "MORPH") sound.playCue();
    const offscreen = !visible(codeContent.current) || !visible(renderContent.current);
    const spatial = currentRun.current.spatial && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !offscreen;
    if (spatial) {
      frames.current.forEach(cancelAnimationFrame);
      pending.current = new Set(resolveTemplate(next.activeTemplate, definition).parts.map(part => part.key));
      applyRun({ ...currentRun.current, generation: currentRun.current.generation + 1,
        spatial: true, travelling: true, offscreen: false });
    } else settle(offscreen);
    setState(next);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => {
      setAnnouncement(`${resolveTemplate(next.activeTemplate, definition).label}: ${next.viewMode === "code" ? "code" : "component"} view selected.`);
    }, 150);
  };

  const complete = (part: PartKey, generation: number) => {
    if (currentRun.current.generation !== generation || !currentRun.current.travelling) return;
    pending.current.delete(part);
    if (pending.current.size === 0) applyRun({ ...currentRun.current, travelling: false });
  };

  useEffect(() => {
    const cancelFlight = () => { if (currentRun.current.travelling) settle(); };
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new ResizeObserver(cancelFlight);
    if (codeContent.current) observer.observe(codeContent.current);
    if (renderContent.current) observer.observe(renderContent.current);
    window.addEventListener("resize", cancelFlight);
    window.addEventListener("scroll", cancelFlight, { passive: true });
    document.addEventListener("visibilitychange", cancelFlight);
    preference.addEventListener("change", cancelFlight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", cancelFlight);
      window.removeEventListener("scroll", cancelFlight);
      document.removeEventListener("visibilitychange", cancelFlight);
      preference.removeEventListener("change", cancelFlight);
      clearTimeout(statusTimer.current);
      frames.current.forEach(cancelAnimationFrame);
    };
  }, [settle]);

  return <div className="lab" data-lab={id} data-view-mode={state.viewMode} data-template={state.activeTemplate}>
    <div className="lab-sheet">
      <div className="lab-toolbar">
        <ModeControl mode={state.viewMode} ready={ready} onChange={mode => command({ type: "SET_VIEW", mode })} />
        <MorphButton mode={state.viewMode} ready={ready} onMorph={() => command({ type: "MORPH" })} />
      </div>
      <MotionConfig reducedMotion="user">
        <LayoutGroup id={`spatial-lab-${namespace}`}>
          <div className="lab-stage" data-travelling={run.travelling}>
            <CodePane mode={state.viewMode} template={template} contentRef={codeContent} run={run} onComplete={complete} headingId={`${namespace}-code`} />
            <RenderPane mode={state.viewMode} template={template} contentRef={renderContent} run={run} onComplete={complete} headingId={`${namespace}-preview`} />
          </div>
        </LayoutGroup>
      </MotionConfig>
    </div>
    <div className="mapping-explanation">
      <p><strong>{template.parts.length} mapped pieces</strong><span className="mapping-separator" aria-hidden="true"> · </span>
        {template.teaching}</p>
      {run.offscreen ? <p className="compare-notice">View changed. Scroll to compare the example.</p> : null}
      <details>
        <summary>How the pieces match</summary>
        <div className="disclosure-content">
          <p>Each moving piece has a matching name in both views. Morph moves it between those places. These examples are prepared in advance.</p>
          <ul>{template.parts.map(part => <li key={part.key}>{part.sourceLabel} → {part.destinationLabel}</li>)}</ul>
          <p>In the implementation, this matching name is called a shared identity (<code>layoutId</code>). The code view is made of styled elements, too.</p>
        </div>
      </details>
    </div>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
  </div>;
}
