"use client";

import { useCallback, useEffect, useRef } from "react";

export function useMorphSound() {
  const resource = useRef<HTMLAudioElement | null>(null);
  const playback = useRef<object | null>(null);

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
    try {
      const audio = new Audio("/audio/morph.mp3");
      resource.current = audio;
      audio.preload = "auto";
      audio.volume = 0.15;
      audio.load();
    } catch { dispose(); }
  }, [dispose]);

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
        if (resource.current === audio && playback.current === activation) stop();
      });
    } catch { stop(); }
  }, [stop]);

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
