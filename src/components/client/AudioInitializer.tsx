"use client";

import { useEffect } from "react";
import audioManager from "@/lib/audio";

export default function AudioInitializer() {
  useEffect(() => {
    let mounted = true;
    let removeListeners = () => {};

    async function init() {
      await audioManager.loadManifest();
      const selected =
        typeof window !== "undefined"
          ? localStorage.getItem("gtt_selected_music")
          : null;
      if (!mounted || !selected) return;

      // Do NOT attempt to create/resume AudioContext here — that triggers the
      // browser autoplay policy warning if there's no user gesture. Instead
      // start playback only in response to the first user gesture.
      const onGesture = async () => {
        try {
          await audioManager.enableAudioContext();
          await audioManager.playMusic(selected);
        } catch (e) {
          console.debug("AudioInitializer: playMusic on gesture failed", e);
        }
        removeListeners();
      };

      removeListeners = () => {
        window.removeEventListener("click", onGesture);
        window.removeEventListener("keydown", onGesture);
        window.removeEventListener("touchstart", onGesture);
        window.removeEventListener("pointerdown", onGesture);
      };

      window.addEventListener("click", onGesture, { once: true });
      window.addEventListener("keydown", onGesture, { once: true });
      window.addEventListener("touchstart", onGesture, { once: true });
      window.addEventListener("pointerdown", onGesture, { once: true });
    }

    init();
    return () => {
      mounted = false;
      try {
        removeListeners();
      } catch (e) {}
    };
  }, []);

  return null;
}
