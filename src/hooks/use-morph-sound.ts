"use client";

import { useCallback, useEffect, useRef } from "react";

// `onUnavailable` is called at most once per preparation (an explicit off-to-on toggle) when the cue
// cannot load, is unsupported, or playback is rejected. There is no automatic retry.
export function useMorphSound(onUnavailable: () => void = () => {}) {
  const resource = useRef<HTMLAudioElement | null>(null);
  const playback = useRef<object | null>(null);
  const reported = useRef(false);
  const callback = useRef(onUnavailable);
  useEffect(() => { callback.current = onUnavailable; });

  const notify = useCallback(() => {
    if (reported.current) return;
    reported.current = true;
    callback.current();
  }, []);

  const stop = useCallback(() => {
    playback.current = null;
    const audio = resource.current;
    if (!audio) return;
    audio.pause();
  }, []);

  const dispose = useCallback(() => {
    stop();
    const audio = resource.current;
    resource.current = null;
    if (!audio) return;
    audio.removeAttribute("src");
    audio.load();
  }, [stop]);

  const prepare = useCallback(() => {
    dispose();
    reported.current = false;
    if (typeof Audio === "undefined") { notify(); return; }
    try {
      const audio = new Audio("/audio/morph.mp3");
      resource.current = audio;
      audio.addEventListener("error", () => { if (resource.current === audio) notify(); });
      audio.preload = "auto";
      audio.volume = 0.15;
      audio.load();
    } catch { dispose(); notify(); }
  }, [dispose, notify]);

  const playCue = useCallback(() => {
    stop();
    const audio = resource.current;
    if (!audio || audio.error || audio.readyState < 2 || document.hidden) return;
    const activation = {};
    playback.current = activation;
    try {
      audio.currentTime = 0;
      audio.volume = 0.15;
      void audio.play().then(() => {
        if (resource.current !== audio || playback.current === null) audio.pause();
      }).catch(() => {
        if (resource.current === audio && playback.current === activation) { stop(); notify(); }
      });
    } catch { stop(); notify(); }
  }, [stop, notify]);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      dispose();
    };
  }, [dispose, stop]);

  return { prepare, playCue, stop, dispose };
}
