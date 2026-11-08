import { ArrowRightLeft, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import type { TemplateId, ViewMode } from "@/lib/lab/types";

const examples = [
  { id: "button", label: "Button" }, { id: "toast", label: "Toast" }, { id: "bento", label: "Bento" },
] as const satisfies readonly { id: TemplateId; label: string }[];

// Custom single-select listbox. The popup is a focusable listbox that uses aria-activedescendant; options
// have no Tab stops. Open/active state is local UI state and never part of AppState. Navigating does not
// commit; only Enter, Space or a pointer click on an option dispatches the selection.
export function TemplateSelector({ ready, templateId, onSelect }: {
  ready: boolean; templateId: TemplateId; onSelect: (id: TemplateId) => void;
}) {
  const base = useId();
  const listId = `${base}-list`;
  const optionId = (index: number) => `${base}-option-${index}`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", timer: undefined as ReturnType<typeof setTimeout> | undefined });
  const selected = Math.max(0, examples.findIndex(entry => entry.id === templateId));

  useEffect(() => { if (open) list.current?.focus(); }, [open]);
  useEffect(() => () => clearTimeout(typed.current.timer), []);

  const resetTypeahead = () => { clearTimeout(typed.current.timer); typed.current.text = ""; };
  const openList = () => { resetTypeahead(); setActive(selected); setOpen(true); };
  const close = (restoreFocus: boolean) => { resetTypeahead(); setOpen(false); if (restoreFocus) trigger.current?.focus(); };
  const commit = (index: number) => { close(true); onSelect(examples[index].id); };

  const onTriggerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); openList(); }
  };
  const onListKeyDown = (event: KeyboardEvent) => {
    const last = examples.length - 1;
    if (event.key === "ArrowDown") setActive(index => Math.min(index + 1, last));
    else if (event.key === "ArrowUp") setActive(index => Math.max(index - 1, 0));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(last);
    else if (event.key === "Enter" || event.key === " ") commit(active);
    else if (event.key === "Escape") close(true);
    else if (event.key === "Tab") { resetTypeahead(); setOpen(false); return; } // Close without committing; focus moves normally.
    else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      clearTimeout(typed.current.timer);
      typed.current.text += event.key.toLowerCase();
      typed.current.timer = setTimeout(() => { typed.current.text = ""; }, 600);
      const match = examples.findIndex(entry => entry.label.toLowerCase().startsWith(typed.current.text));
      if (match >= 0) setActive(match);
      return;
    } else return;
    event.preventDefault();
  };
  // Dismiss when focus leaves the popup. Moving to the trigger is left to its own click handler.
  const onListBlur = (event: FocusEvent) => { if (event.relatedTarget !== trigger.current) { resetTypeahead(); setOpen(false); } };

  return <div className="example-select">
    <button ref={trigger} type="button" className="pill example-trigger" disabled={!ready}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
      onClick={() => (open ? close(true) : openList())} onKeyDown={onTriggerKeyDown}>
      Example: {examples[selected].label}
      <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" />
    </button>
    <ul ref={list} id={listId} className="example-popup" role="listbox" aria-label="Example" tabIndex={-1} hidden={!open}
      aria-activedescendant={open ? optionId(active) : undefined} onKeyDown={onListKeyDown} onBlur={onListBlur}>
      {examples.map((entry, index) => <li key={entry.id} id={optionId(index)} role="option" className="example-option"
        aria-selected={index === selected} data-active={open && index === active || undefined}
        onMouseDown={event => event.preventDefault()} onMouseMove={() => setActive(index)} onClick={() => commit(index)}>
        {entry.label}
      </li>)}
    </ul>
  </div>;
}

export function SoundButton({ enabled, ready, onToggle }: { enabled: boolean; ready: boolean; onToggle: () => void }) {
  const Icon = enabled ? Volume2 : VolumeX;
  return <button type="button" className="pill sound-pill" aria-label="Sound" aria-pressed={enabled}
    disabled={!ready} onClick={onToggle}>
    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
    <span aria-hidden="true">{enabled ? "Sound on" : "Sound off"}</span>
  </button>;
}

export function MorphButton({ mode, ready, onMorph }: { mode: ViewMode; ready: boolean; onMorph: () => void }) {
  return <button type="button" className="morph-button" disabled={!ready} onClick={onMorph}>
    <ArrowRightLeft size={18} strokeWidth={1.75} aria-hidden="true" />
    {mode === "code" ? "Morph to component" : "Morph to code"}
  </button>;
}

export function Header(props: { mode: ViewMode; ready: boolean; onMorph: () => void;
  templateId: TemplateId; onSelect: (id: TemplateId) => void;
  soundEnabled: boolean; soundUnavailable: boolean; onToggleSound: () => void;
}) {
  return <header className="lab-header">
    <div className="identity">
      <h1>Spatial DOM Transition Lab</h1>
      <p>Code-to-Component Morph Engine</p>
    </div>
    <div className="header-controls">
      <TemplateSelector ready={props.ready} templateId={props.templateId} onSelect={props.onSelect} />
      <SoundButton enabled={props.soundEnabled} ready={props.ready} onToggle={props.onToggleSound} />
      {props.soundEnabled && props.soundUnavailable ? <span className="sound-note">Sound unavailable</span> : null}
      <MorphButton {...props} />
    </div>
  </header>;
}
