import { useId, useRef, type KeyboardEvent } from "react";
import type { ViewMode } from "@/lib/lab/types";

const modes = [{ value: "code", label: "Code" }, { value: "rendered", label: "Component" }] as const;

// Custom ARIA radio group (not native radios, not tabs). Roving tabIndex: only the selected option is
// in the Tab order. Arrow keys move and select with wrapping; Home/End select first/last; Space and
// Enter activate the focused option through the button's native click.
export function ModeControl({ mode, ready, onChange }: {
  mode: ViewMode; ready: boolean; onChange: (mode: ViewMode) => void;
}) {
  const labelId = useId();
  const options = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const next = (index + modes.length) % modes.length;
    onChange(modes[next].value);
    options.current[next]?.focus();
  };
  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const target = event.key === "ArrowRight" || event.key === "ArrowDown" ? index + 1
      : event.key === "ArrowLeft" || event.key === "ArrowUp" ? index - 1
        : event.key === "Home" ? 0 : event.key === "End" ? modes.length - 1 : null;
    if (target === null) return;
    event.preventDefault();
    select(target);
  };

  return <div className="mode-control">
    <span id={labelId} className="mode-label">View</span>
    <div className="mode-options" role="radiogroup" aria-labelledby={labelId}>
      {modes.map((option, index) => <button key={option.value} type="button" role="radio" className="mode-option"
        ref={element => { options.current[index] = element; }}
        aria-checked={mode === option.value} tabIndex={mode === option.value ? 0 : -1} disabled={!ready}
        onClick={() => onChange(option.value)} onKeyDown={event => onKeyDown(event, index)}>{option.label}</button>)}
    </div>
  </div>;
}
