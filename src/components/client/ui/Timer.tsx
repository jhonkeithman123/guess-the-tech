"use client";

import React, { useEffect } from "react";

interface TimerProps {
  seconds: number;
  onExpire?: () => void;
  paused?: boolean;
  onTick?: (timeLeft: number) => void;
}

function Timer({ seconds, onExpire, paused = false, onTick }: TimerProps) {
  // Controlled display-only Timer. Parent manages ticking and expiration.
  useEffect(() => {
    if (onTick) onTick(seconds);
    // Do NOT call onExpire here; parent owns expiration to avoid double-calls
  }, [seconds, onTick]);

  return <div className="text-2xl font-bold text-emerald-400">{seconds}s</div>;
}

export default Timer;
