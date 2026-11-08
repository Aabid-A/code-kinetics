import { ArrowRightLeft, ChevronDown } from "lucide-react";
import type { TemplateId, ViewMode } from "@/lib/lab/types";

export function TemplateSelector({ ready, templateId, onSelect }: {
  ready: boolean; templateId: TemplateId; onSelect: (id: TemplateId) => void;
}) {
  return <label className="template-selector">
    <span>Example</span>
    <select aria-label="Example" value={templateId} disabled={!ready} onChange={event => {
      const id = event.currentTarget.value;
      if (id === "button" || id === "toast" || id === "bento") onSelect(id);
    }}>
      <option value="button">Button</option>
      <option value="toast">Toast</option>
      <option value="bento">Bento</option>
    </select>
    <ChevronDown className="select-chevron" size={16} strokeWidth={1.75} aria-hidden="true" />
  </label>;
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
      <label className="template-selector">
        <span className="sr-only">Sound</span>
        <select aria-label="Sound" value={props.soundEnabled ? "on" : "off"} disabled={!props.ready}
          onChange={event => {
            if ((event.currentTarget.value === "on") !== props.soundEnabled) props.onToggleSound();
          }}>
          <option value="off">Sound off</option>
          <option value="on">Sound on</option>
        </select>
        <ChevronDown className="select-chevron" size={16} strokeWidth={1.75} aria-hidden="true" />
      </label>
      {props.soundEnabled && props.soundUnavailable ? <span className="sound-note">Sound unavailable</span> : null}
      <MorphButton {...props} />
    </div>
  </header>;
}
