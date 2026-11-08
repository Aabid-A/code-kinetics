"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useMorphSound } from "@/hooks/use-morph-sound";

// The sound preference is one page-level setting shared by every chapter lab. Labs only ask for the cue;
// the provider decides whether it is enabled. Outside a provider (test fixtures) the cue is a no-op.
export type SoundApi = { enabled: boolean; unavailable: boolean; toggle: () => void; playCue: () => void; stop: () => void };
const silent: SoundApi = { enabled: false, unavailable: false, toggle() {}, playCue() {}, stop() {} };
export const SoundContext = createContext<SoundApi>(silent);
export const useSound = () => useContext(SoundContext);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const [unavailable, setUnavailable] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const sound = useMorphSound(useCallback(() => {
    setUnavailable(true);
    setAnnouncement("Sound unavailable.");
  }, []));

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    setUnavailable(false);
    setAnnouncement("");
    if (next) sound.prepare(); else sound.dispose();
  }, [sound]);
  const playCue = useCallback(() => { if (enabledRef.current) sound.playCue(); }, [sound]);
  const api = useMemo<SoundApi>(() => ({ enabled, unavailable, toggle, playCue, stop: sound.stop }),
    [enabled, unavailable, toggle, playCue, sound.stop]);

  return <SoundContext.Provider value={api}>
    {children}
    <p className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-sound-status>{announcement}</p>
  </SoundContext.Provider>;
}
