"use client";

import { useHydrated } from "@/hooks/use-hydrated";
import { SoundButton } from "@/components/lab/Controls";
import { Logotype } from "./Logotype";
import { useSound } from "./Sound";

export function TopBar() {
  const ready = useHydrated();
  const sound = useSound();
  return <header className="topbar">
    <Logotype />
    <div className="topbar-sound">
      {sound.enabled && sound.unavailable ? <span className="sound-note">Sound unavailable</span> : null}
      <SoundButton enabled={sound.enabled} ready={ready} onToggle={sound.toggle} />
    </div>
  </header>;
}
