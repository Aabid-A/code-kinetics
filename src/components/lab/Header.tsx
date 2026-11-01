import { ArrowRightLeft } from "lucide-react";
import type { ViewMode } from "@/lib/lab/types";

export function TemplateSelector({ ready }: { ready: boolean }) {
  return <label className="template-selector">
    <span>Example</span>
    <select aria-label="Example" value="button" disabled={!ready} onChange={() => {}}>
      <option value="button">Button</option>
      <option value="toast" disabled>Toast — unavailable</option>
      <option value="bento" disabled>Bento — unavailable</option>
    </select>
  </label>;
}

export function MorphButton({ mode, ready, onMorph }: { mode: ViewMode; ready: boolean; onMorph: () => void }) {
  return <button type="button" className="morph-button" disabled={!ready} onClick={onMorph}>
    <ArrowRightLeft size={18} strokeWidth={1.75} aria-hidden="true" />
    {mode === "code" ? "Morph to component" : "Morph to code"}
  </button>;
}

export function Header(props: { mode: ViewMode; ready: boolean; onMorph: () => void }) {
  return <header className="lab-header">
    <div className="identity">
      <h1>Spatial DOM Transition Lab</h1>
      <p>Code-to-Component Morph Engine</p>
    </div>
    <div className="header-controls">
      <TemplateSelector ready={props.ready} />
      <MorphButton {...props} />
    </div>
  </header>;
}
