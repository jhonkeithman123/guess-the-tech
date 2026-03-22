import React, { useEffect, useState } from "react";

interface TimerProps {
  seconds: number;
  onExpire: () => void;
  paused?: boolean;
}

export default function Timer({
  seconds,
  onExpire,
  paused = false,
}: TimerProps) {
  const [time, setTime] = useState(seconds);

  useEffect(() => {
    setTime(seconds);
  }, [seconds]);

  useEffect(() => {
    if (time <= 0) {
      onExpire();
      return;
    }
    if (paused) return;
    const interval = setInterval(() => {
      setTime((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [time, onExpire, paused]);

  return <div className="text-2xl font-bold text-emerald-400">{time}s</div>;
}
