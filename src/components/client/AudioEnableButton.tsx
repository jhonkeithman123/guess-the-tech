"use client";

import { useEffect, useState } from "react";
import audioManager from "@/lib/audio";

export default function AudioEnableButton() {
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = localStorage.getItem("gtt_selected_music");
    setSelected(s);
    setPlaying(audioManager.isPlaying());
    const id = setInterval(() => {
      setPlaying(audioManager.isPlaying());
    }, 500);
    return () => clearInterval(id);
  }, []);

  if (!selected) return null;
  if (playing) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={async () => {
          try {
            await audioManager.enableAudioContext();
            await audioManager.playMusic(selected);
          } catch (e) {
            console.error("AudioEnableButton: failed to play", e);
          }
          setPlaying(audioManager.isPlaying());
        }}
        className="px-4 py-2 rounded bg-emerald-500 text-slate-900 font-bold shadow-lg"
      >
        Enable Audio
      </button>
    </div>
  );
}
