import type { ViewMode } from "@/lib/lab/types";

export function ModeControl({ mode, ready, onChange }: {
  mode: ViewMode; ready: boolean; onChange: (mode: ViewMode) => void;
}) {
  return <fieldset className="mode-control" disabled={!ready}>
    <legend>View</legend>
    <div className="mode-options">
      <label><input type="radio" name="view" value="code" checked={mode === "code"}
        onChange={() => onChange("code")} /><span>Code</span></label>
      <label><input type="radio" name="view" value="rendered" checked={mode === "rendered"}
        onChange={() => onChange("rendered")} /><span>Component</span></label>
    </div>
  </fieldset>;
}
