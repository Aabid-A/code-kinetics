"use client";

import { LayoutGroup, MotionConfig } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { resolveTemplate, type PartKey, type TemplateDefinition } from "@/lib/lab/templates";
import { initialState, transition, type Command } from "@/lib/lab/types";
import { Header } from "./Header";
import { ModeControl } from "./ModeControl";
import { PromptBar } from "./PromptBar";
import { CodePane } from "./CodePane";
import { RenderPane } from "./RenderPane";
import type { MotionRun } from "./SharedPart";
import { useMorphSound } from "@/hooks/use-morph-sound";

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

export function Lab() {
  const namespace = useId();
  const ready = useSyncExternalStore(subscribeReady, getReady, getServerReady);
  const [state, setState] = useState(initialState);
  const latest = useRef(initialState);
  const sound = useMorphSound();
  const [run, setRun] = useState(initialRun);
  const currentRun = useRef(initialRun);
  const pending = useRef(new Set<PartKey>());
  const codeContent = useRef<HTMLDivElement>(null);
  const renderContent = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState("");
  const statusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const frames = useRef<number[]>([]);
  const [generated, setGenerated] = useState<TemplateDefinition | null>(null);
  const generatedRef = useRef<TemplateDefinition | null>(null);
  const template = resolveTemplate(state.activeTemplate, generated);

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
    if (input.type === "TOGGLE_SOUND") {
      latest.current = next;
      setState(next);
      if (next.soundEnabled) sound.prepare();
      else sound.dispose();
      return;
    }
    const templateChanged = next.activeTemplate !== latest.current.activeTemplate || input.type === "LOAD_GENERATED";
    latest.current = next;
    if (templateChanged) sound.stop();
    else if (input.type === "MORPH" && next.soundEnabled) sound.playCue();
    const offscreen = !visible(codeContent.current) || !visible(renderContent.current);
    const spatial = currentRun.current.spatial && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && !offscreen;
    if (templateChanged) settle();
    else if (spatial) {
      frames.current.forEach(cancelAnimationFrame);
      pending.current = new Set(resolveTemplate(next.activeTemplate, generatedRef.current).parts.map(part => part.key));
      applyRun({ ...currentRun.current, generation: currentRun.current.generation + 1,
        spatial: true, travelling: true, offscreen: false });
    } else settle(offscreen);
    setState(next);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => {
      setAnnouncement(`${resolveTemplate(next.activeTemplate, generatedRef.current).label}: ${next.viewMode === "code" ? "code" : "component"} view selected.`);
    }, 150);
  };

  const loadGenerated = (definition: TemplateDefinition) => {
    generatedRef.current = definition;
    setGenerated(definition);
    command({ type: "LOAD_GENERATED" });
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

  return <main className="lab-frame" data-view-mode={state.viewMode} data-template={state.activeTemplate}>
    <Header mode={state.viewMode} ready={ready} templateId={state.activeTemplate}
      generatedLabel={generated?.label} soundEnabled={state.soundEnabled} onToggleSound={() => command({ type: "TOGGLE_SOUND" })}
      onSelect={id => command({ type: "SELECT_TEMPLATE", id })} onMorph={() => command({ type: "MORPH" })} />
    <PromptBar ready={ready} onGenerated={loadGenerated} />
    <div className="lab-introduction">
      <p>Watch matching pieces move from code to component.</p>
      <ModeControl mode={state.viewMode} ready={ready} onChange={mode => command({ type: "SET_VIEW", mode })} />
    </div>
    <MotionConfig reducedMotion="user">
      <LayoutGroup id={`spatial-lab-${namespace}`}>
        <div className="lab-stage" data-travelling={run.travelling}>
          <CodePane mode={state.viewMode} template={template} contentRef={codeContent} run={run} onComplete={complete} />
          <RenderPane mode={state.viewMode} template={template} contentRef={renderContent} run={run} onComplete={complete} />
        </div>
      </LayoutGroup>
    </MotionConfig>
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
      <p className="disclaimer">A visual demonstration with fixed examples. No code is compiled or run.</p>
    </div>
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
    <noscript><p className="compare-notice">Interaction requires JavaScript. The fixed example and explanation remain available.</p></noscript>
  </main>;
}
