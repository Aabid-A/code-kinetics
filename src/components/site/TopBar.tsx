"use client";

import { useSyncExternalStore } from "react";
import { SoundButton } from "@/components/lab/Header";
import { useSound } from "./Sound";

const subscribeReady = () => () => {};
const getReady = () => true;
const getServerReady = () => false;

export function TopBar() {
  const ready = useSyncExternalStore(subscribeReady, getReady, getServerReady);
  const sound = useSound();
  return <header className="topbar">
    <p className="wordmark">Spatial DOM Transition Lab</p>
    <div className="topbar-sound">
      {sound.enabled && sound.unavailable ? <span className="sound-note">Sound unavailable</span> : null}
      <SoundButton enabled={sound.enabled} ready={ready} onToggle={sound.toggle} />
    </div>
  </header>;
}
