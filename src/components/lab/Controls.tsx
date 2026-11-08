import { ArrowRightLeft, Volume2, VolumeX } from "lucide-react";
import type { ViewMode } from "@/lib/lab/types";

// The two buttons the lab shares: the page-level Sound toggle (in the top bar) and each lab's Morph action.
export function SoundButton({ enabled, ready, onToggle }: { enabled: boolean; ready: boolean; onToggle: () => void }) {
  const Icon = enabled ? Volume2 : VolumeX;
  // The accessible name is the visible word "Sound" (stable, per SPEC R03); the state word is hidden from
  // assistive technology because aria-pressed carries it. The name stays a prefix of the visible label (WCAG 2.5.3).
  return <button type="button" className="sound-pill" aria-pressed={enabled}
    disabled={!ready} onClick={onToggle}>
    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
    <span>Sound<span aria-hidden="true">{enabled ? " on" : " off"}</span></span>
  </button>;
}

export function MorphButton({ mode, ready, onMorph }: { mode: ViewMode; ready: boolean; onMorph: () => void }) {
  return <button type="button" className="morph-button" disabled={!ready} onClick={onMorph}>
    <ArrowRightLeft size={18} strokeWidth={1.75} aria-hidden="true" />
    {mode === "code" ? "Morph to component" : "Morph to code"}
  </button>;
}
