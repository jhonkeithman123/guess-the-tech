"use client";

import { useEffect, useState } from "react";
import audioManager from "@/lib/audio";

export default function AudioDebugOverlay() {
  const [state, setState] = useState({} as any);

  useEffect(() => {
    function refresh() {
      const s = {
        audioCtxState: (audioManager as any).audioCtx?.state || null,
        isPlaying: audioManager.isPlaying(),
        manifest: (audioManager as any).manifest,
        selected:
          typeof window !== "undefined"
            ? localStorage.getItem("gtt_selected_music")
            : null,
      };
      setState(s);
      console.debug("AudioDebugOverlay refresh", s);
    }
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: "fixed", left: 8, bottom: 8, zIndex: 9999 }}>
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: 8,
          borderRadius: 6,
          fontSize: 12,
        }}
      >
        <div>
          <strong>Audio Debug</strong>
        </div>
        <div>AudioCtx: {String(state.audioCtxState)}</div>
        <div>Playing: {String(state.isPlaying)}</div>
        <div>Selected: {state.selected || "(none)"}</div>
        <div style={{ maxWidth: 320, overflowWrap: "anywhere" }}>
          Manifest keys:{" "}
          {state.manifest ? Object.keys(state.manifest).join(",") : "(none)"}
        </div>
      </div>
    </div>
  );
}
