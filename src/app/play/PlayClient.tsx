"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Timer from "@/components/client/Timer";
import Question from "@/components/client/Question";
import audioManager from "@/lib/audio";

export default function PlayClient() {
  // Base per-question timer (editable at runtime). Starts at 10s by default.
  const [baseQuestionTimer, setBaseQuestionTimer] = useState<number>(10);
  // How many questions between each -1s decay (default 5)
  const [decayInterval, setDecayInterval] = useState<number>(5);

  // Determine per-question timer based on question count.
  // Starts at `baseQuestionTimer` and decreases by 1s every 5 questions (min 1s).
  function getTimerForQuestionNumber(n: number) {
    const dec = Math.floor(n / decayInterval);
    return Math.max(1, baseQuestionTimer - dec);
  }

  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [questionNumber, setQuestionNumber] = useState(0); // how many questions shown so far
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [expired, setExpired] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [health, setHealth] = useState(4);
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [standby, setStandby] = useState(false);
  // Moved to top level to fix hook order
  const [showUserPrompt, setShowUserPrompt] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  // Timer progress for green light (must be before any return)
  // Compute effective question count from `idx` (current question index + 1)
  const effectiveQuestionCount = Math.max(1, idx + 1);
  // Timer is computed from the question count (decays every `decayInterval` questions)
  const timer = getTimerForQuestionNumber(effectiveQuestionCount);
  const [timerLeft, setTimerLeft] = useState(timer);
  // For smooth animation
  const [smoothProgress, setSmoothProgress] = useState(0); // 0=start, 1=end
  // Precise end time for rAF-driven countdown
  const [endTime, setEndTime] = useState<number | null>(null);
  const pausedRemainingRef = useRef<number | null>(null);

  // On mount: restore persisted music selection when visiting /play
  useEffect(() => {
    try {
      const sel =
        typeof window !== "undefined"
          ? localStorage.getItem("gtt_selected_music")
          : null;
      if (sel) {
        audioManager.enableAudioContext().catch(() => {});
        audioManager.playMusic(sel).catch(() => {});
      }
    } catch (e) {}
    // intentionally do not enable or start audio on mount.
    // AudioInitializer and AudioEnableButton will enable/resume audio
    // in response to a user gesture per browser autoplay policy.
  }, []);

  // Expose helpers for quick runtime adjustment (dev use)
  useEffect(() => {
    try {
      (window as any).setBaseQuestionTimer = setBaseQuestionTimer;
      (window as any).getBaseQuestionTimer = () => baseQuestionTimer;
      (window as any).setDecayInterval = setDecayInterval;
      (window as any).getDecayInterval = () => decayInterval;
    } catch (e) {}
    return () => {
      try {
        delete (window as any).setBaseQuestionTimer;
        delete (window as any).getBaseQuestionTimer;
        delete (window as any).setDecayInterval;
        delete (window as any).getDecayInterval;
      } catch (e) {}
    };
  }, [baseQuestionTimer, decayInterval]);

  // When idx changes (new question), reset timerLeft and smoothProgress
  useEffect(() => {
    setTimerLeft(timer);
    setSmoothProgress(0);
    // only set endTime when the game is active to avoid stale expired times
    if (standby) {
      setEndTime(performance.now() + timer * 1000);
    }
  }, [idx, timer, standby]);

  // Ensure timer is reset when the player actually starts the game
  useEffect(() => {
    if (standby) {
      setTimerLeft(timer);
      setSmoothProgress(0);
      setEndTime(performance.now() + timer * 1000);
      // reset expire guard when starting a new game/session
      expireRef.current = false;
      // mark the initial question as seen and start question counter
      if (history && history.length > 0) {
        const first = history[0];
        lastSeenRef.current[first] = 1;
        setQuestionNumber(1);
      }
    } else {
      // clear any existing endTime when leaving standby
      setEndTime(null);
    }
  }, [standby, timer]);

  // Freeze countdown while paused: store remaining time and clear endTime.
  // Separate effects for pause and resume so they only run on pause transitions.
  useEffect(() => {
    if (!paused) return;
    // compute remaining ms and store it
    if (endTime) {
      pausedRemainingRef.current = Math.max(0, endTime - performance.now());
    } else {
      pausedRemainingRef.current = timerLeft * 1000;
    }
    setEndTime(null);
    // run only when `paused` becomes true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  useEffect(() => {
    if (paused) return;
    if (!standby) return;
    // resuming: restore endTime from stored remaining
    const remaining = pausedRemainingRef.current ?? timerLeft * 1000;
    setEndTime(performance.now() + Math.max(0, remaining));
    pausedRemainingRef.current = null;
    // run when `paused` or `standby` changes to resume
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, standby]);

  // Smooth animation effect driven by `endTime` to avoid re-running each tick
  useEffect(() => {
    if (!endTime) return;
    const start = endTime - timer * 1000;
    let rafId: number;
    function animate() {
      const now = performance.now();
      const elapsed = Math.max(0, now - start);
      const progress = Math.min(elapsed / (timer * 1000), 1);
      setSmoothProgress(progress);
      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    }
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [timer, endTime]);

  // Track last 20 question indices to avoid repeats

  // Track last 20 question indices to avoid repeats
  const [history, setHistory] = useState<number[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const lastSeenRef = useRef<Record<number, number>>({});
  useEffect(() => {
    fetch("/api/questions")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("API error:", data.error || data);
          setAllQuestions([]);
          setQuestions([]);
          return;
        }
        setAllQuestions(data);
        // Pick first question randomly
        const firstIdx = Math.floor(Math.random() * data.length);
        setQuestions([data[firstIdx]]);
        setHistory([firstIdx]);
        setIdx(0);
        // don't mark lastSeen yet; will mark when game starts (standby)
      });
  }, []);

  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const expireRef = useRef(false);
  const submittedRef = useRef(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  // Submit leaderboard helper (idempotent via submittedRef)
  async function submitLeaderboard(email?: string | null) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    try {
      const time_taken = startTime
        ? Math.round((Date.now() - startTime) / 1000)
        : 0;
      const payload = {
        player_name: username || "anonymous",
        score,
        time_taken,
        email: email ?? null,
      };
      console.log("[play] submitting leaderboard", payload);
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      try {
        console.log(
          "[play] leaderboard response",
          res.status,
          JSON.parse(text),
        );
      } catch (e) {
        console.log("[play] leaderboard response (non-json)", res.status, text);
      }
    } catch (e) {
      console.error("Failed to submit leaderboard:", e);
    }
  }
  // Victory condition: surviving 2 minutes or reaching max questions
  // Removed global 2-minute victory timer: per-question timers now govern flow.
  // When the game ends, ensure the timer stops and no further expire actions occur
  useEffect(() => {
    if (!showResult) return;
    // clear any running countdown
    setEndTime(null);
    // pause UI interactions
    setPaused(true);
    // prevent any further expire handling
    expireRef.current = true;
    // show email prompt to collect optional email before submitting
    setShowEmailPrompt(true);
    try {
      audioManager.playEffect("gameover");
    } catch (e) {}
  }, [showResult, username, score]);
  // Helper to get a random question index not in last 20
  function getNextQuestionIdx() {
    if (!allQuestions.length) return 0;
    const recentSet = new Set(history.slice(-20));
    let tries = 0;
    const maxTries = 100;
    while (tries < maxTries) {
      const candidate = Math.floor(Math.random() * allQuestions.length);
      const lastSeen = lastSeenRef.current[candidate] ?? -Infinity;
      const age = questionNumber - lastSeen;
      // enforce strict cooldown: cannot appear until 15 questions have passed
      if (lastSeen === -Infinity || age >= 15) {
        // after cooldown, only allow with chance (30%) to avoid immediate repeat
        if (lastSeen === -Infinity || Math.random() < 0.3) {
          return candidate;
        }
        // else try again
      } else {
        // still in cooldown; reject
      }
      tries++;
    }
    // fallback: pick any not in recentSet if possible
    for (let i = 0; i < allQuestions.length; i++) {
      if (!recentSet.has(i)) return i;
    }
    return Math.floor(Math.random() * allQuestions.length);
  }

  const handleAnswer = useCallback(
    (choice: string) => {
      if (answered || paused) return;
      const correct =
        questions[idx] &&
        choice.trim().toLowerCase() ===
          String(questions[idx].answer).trim().toLowerCase();
      setAnswered(true);
      setLastCorrect(correct);
      if (correct) {
        setScore((s) => s + 1);
        try {
          audioManager.playEffect("correct");
        } catch (e) {}
      } else {
        setHealth((h) => Math.max(0, h - 1));
        try {
          audioManager.playEffect("wrong");
        } catch (e) {}
      }
      setTimeout(() => {
        setAnswered(false);
        setExpired(false);
        setPaused(false);
        setLastCorrect(null);
        // determine if this wrong answer caused game over based on
        // the health snapshot when the handler ran
        const willGameOver = !correct && health <= 1;
        if (willGameOver) {
          setShowResult(true);
          return;
        }
        // Unlimited questions: always fetch next
        const nextIdx = getNextQuestionIdx();
        setQuestions((prev) => {
          // Randomize choices order for next question
          const nextQ = { ...allQuestions[nextIdx] };
          if (Array.isArray(nextQ.choices)) {
            nextQ.choices = [...nextQ.choices].sort(() => 0.5 - Math.random());
          }
          return [...prev, nextQ];
        });
        setIdx((i) => i + 1);
        setHistory((h) => [...h, nextIdx]);
        // record when this question was shown and advance the question counter
        setQuestionNumber((n) => {
          const newN = n + 1;
          lastSeenRef.current[nextIdx] = newN;
          return newN;
        });
      }, 800);
    },
    [answered, idx, questions, paused, health, allQuestions, history],
  );

  // Timer expiration handler (must be after all relevant hooks and helpers)
  const handleExpire = useCallback(() => {
    if (expireRef.current || showResult) return;
    expireRef.current = true;
    setExpired(true);
    // mark as answered/wrong so UI shows feedback
    setAnswered(true);
    setLastCorrect(false);
    setHealth((h) => {
      const nh = Math.max(0, h - 1);
      if (nh <= 0) {
        try {
          audioManager.playEffect("gameover");
        } catch (e) {}
        setShowResult(true);
      }
      return nh;
    });
    setTimeout(() => {
      // advance to next question
      setAnswered(false);
      setExpired(false);
      const nextIdx = getNextQuestionIdx();
      setQuestions((prev) => {
        const nextQ = { ...allQuestions[nextIdx] };
        if (Array.isArray(nextQ.choices)) {
          nextQ.choices = [...nextQ.choices].sort(() => 0.5 - Math.random());
        }
        return [...prev, nextQ];
      });
      setIdx((i) => i + 1);
      setHistory((h) => [...h, nextIdx]);
      // record last-seen and advance question counter
      setQuestionNumber((n) => {
        const newN = n + 1;
        lastSeenRef.current[nextIdx] = newN;
        return newN;
      });
      expireRef.current = false;
    }, 800);
  }, [
    allQuestions,
    getNextQuestionIdx,
    setQuestions,
    setIdx,
    setHistory,
    setExpired,
    setAnswered,
  ]);

  // rAF-driven, sub-second ticking while game is active
  useEffect(() => {
    if (!standby) return;
    if (paused) return;
    if (!endTime) return;
    const target = endTime;
    let rafId: number;
    function tick() {
      const now = performance.now();
      const remainingMs = Math.max(0, target - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      setTimerLeft((prev) => {
        if (prev !== remainingSec) return remainingSec;
        return prev;
      });
      if (remainingMs <= 0) {
        try {
          handleExpire();
        } catch (e) {
          console.error("handleExpire error:", e);
        }
        return;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [standby, paused, endTime, handleExpire]);

  // Standby screen
  if (!standby) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-10 space-y-6 text-center">
          <h2 className="text-4xl font-bold text-emerald-400 mb-4">
            Welcome{username ? `, ${username}` : ""}!
          </h2>
          <div className="text-xl mb-4">Get ready to play Guess the Tech!</div>
          <form
            className="flex flex-col items-center gap-4 mb-6"
            onSubmit={async (e) => {
              e.preventDefault();
              if (usernameInput.trim()) {
                try {
                  await audioManager.enableAudioContext();
                  await audioManager.loadManifest();
                  // preload SFX to reduce first-play latency
                  await audioManager.preloadSfx();
                } catch (e) {}
                setUsername(usernameInput.trim());
                setStartTime(Date.now());
                setStandby(true);
              }
            }}
          >
            <input
              className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter your username"
              maxLength={24}
              autoFocus
            />
            <button
              type="submit"
              className="px-8 py-3 rounded bg-emerald-400 text-slate-950 font-bold text-xl hover:bg-emerald-500 transition"
              disabled={!usernameInput.trim()}
            >
              Start Quiz
            </button>
          </form>
          <div className="mb-6 text-left text-base text-slate-300">
            <h3 className="text-lg font-semibold text-emerald-300 mb-2">
              How to Play:
            </h3>
            <ul className="list-disc list-inside space-y-1">
              <li>
                You will be shown a series of logos from various technologies,
                apps, or tools.
              </li>
              <li>
                For each logo, select the correct answer from four choices
                before the timer runs out.
              </li>
              <li>Each question has a helpful hint if you get stuck.</li>
              <li>
                You have{" "}
                <span className="text-red-400 font-bold">4 health points</span>.
                Each wrong answer costs 1 health.
              </li>
              <li>
                The game ends when you run out of health or finish all
                questions.
              </li>
              <li>Try to get the highest score possible!</li>
            </ul>
          </div>
          <div className="flex flex-row justify-center gap-4 mt-4">
            <button
              className="px-8 py-3 rounded bg-slate-700 text-slate-200 font-bold text-xl hover:bg-slate-600 transition"
              onClick={() => (window.location.href = "/")}
            >
              Exit
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!questions.length) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-transparent text-slate-200">
        <div className="text-2xl animate-pulse">Loading questions...</div>
      </main>
    );
  }

  // (removed duplicate, now at top level)
  if (showResult) {
    // If email collection is pending, show the email form first
    if (showEmailPrompt && !emailSubmitted) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-transparent text-slate-200">
          <div className="max-w-2xl w-full glass-card rounded-xl shadow-2xl p-10 space-y-6 text-center">
            <h2 className="text-4xl font-bold text-emerald-400 mb-4">
              Game Over!
            </h2>
            <div className="text-2xl mb-2">
              Your Score: <span className="text-emerald-400">{score}</span>
            </div>
            <div className="text-lg text-slate-300 mb-4">
              Enter your email to complete your leaderboard entry (optional)
            </div>
            <form
              className="flex flex-col items-center gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await submitLeaderboard(emailInput.trim() || null);
                setEmailSubmitted(true);
                setShowEmailPrompt(false);
                // then show the regular post-game options
                setTimeout(() => setShowUserPrompt(true), 100);
              }}
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 w-80"
              />
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-emerald-400 text-slate-950 font-bold"
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="px-6 py-2 rounded bg-slate-700 text-slate-200 font-bold"
                  onClick={async () => {
                    await submitLeaderboard(null);
                    setEmailSubmitted(true);
                    setShowEmailPrompt(false);
                    setTimeout(() => setShowUserPrompt(true), 100);
                  }}
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </main>
      );
    }

    // After email step (or if already submitted), show the regular options
    if (!showUserPrompt) {
      setTimeout(() => setShowUserPrompt(true), 100); // trigger prompt after render
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-transparent text-slate-200">
          <div className="max-w-2xl w-full glass-card rounded-xl shadow-2xl p-10 space-y-6 text-center">
            <h2 className="text-4xl font-bold text-emerald-400 mb-4">
              Game Over!
            </h2>
            <div className="text-2xl mb-2">
              Your Score: <span className="text-emerald-400">{score}</span>
            </div>
            <div className="text-xl mb-2">
              Health: <span className="text-red-400">{health}</span>
            </div>
            <div className="text-lg text-slate-300 mt-6">
              Loading options...
            </div>
          </div>
        </main>
      );
    }
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-transparent text-slate-200">
        <div className="max-w-2xl w-full glass-card rounded-xl shadow-2xl p-10 space-y-6 text-center">
          <h2 className="text-4xl font-bold text-emerald-400 mb-4">
            Game Over!
          </h2>
          <div className="text-2xl mb-2">
            Your Score: <span className="text-emerald-400">{score}</span>
          </div>
          <div className="text-xl mb-2">
            Health: <span className="text-red-400">{health}</span>
          </div>
          <div className="mb-6 text-lg text-slate-300">
            Play again as the same user or a different user?
          </div>
          <div className="flex flex-col gap-4 items-center">
            <button
              className="px-6 py-3 rounded bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-500 transition w-64"
              onClick={() => {
                setIdx(0);
                setScore(0);
                setExpired(false);
                setAnswered(false);
                setPaused(false);
                setHealth(4);
                setShowResult(false);
                setStandby(false);
                setShowUserPrompt(false);
                setEmailSubmitted(false);
                submittedRef.current = false;
              }}
            >
              Same User: {username}
            </button>
            <form
              className="flex flex-col gap-2 w-64"
              onSubmit={(e) => {
                e.preventDefault();
                if (newUsername.trim()) {
                  setUsername(newUsername.trim());
                  setIdx(0);
                  setScore(0);
                  setExpired(false);
                  setAnswered(false);
                  setPaused(false);
                  setHealth(4);
                  setShowResult(false);
                  setStandby(false);
                  setShowUserPrompt(false);
                  setEmailSubmitted(false);
                  submittedRef.current = false;
                }
              }}
            >
              <input
                className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Enter new username"
                maxLength={24}
              />
              <button
                type="submit"
                className="px-6 py-2 rounded bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-500 transition"
              >
                Play as Different User
              </button>
            </form>
            <button
              className="px-6 py-2 rounded bg-slate-700 text-slate-200 font-bold hover:bg-slate-600 transition w-64"
              onClick={() => (window.location.href = "/")}
            >
              Home
            </button>
            <button
              className="px-6 py-2 rounded bg-blue-500 text-white font-bold hover:bg-blue-600 transition w-64"
              onClick={() => (window.location.href = "/leaderboard")}
            >
              Go to Leaderboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const q = questions[idx];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-transparent text-slate-200 font-mono p-4">
      <div className="max-w-4xl w-full glass-card rounded-xl shadow-2xl p-12 space-y-6 text-center relative overflow-hidden">
        {/* Gradient bar with moving green light */}
        {/* Shrinking gradient bar with moving green light */}
        {(() => {
          const progress = (timer - timerLeft) / timer; // 0=start, 1=end
          const minBarWidth = 0.08; // 8% minimum width so it doesn't fully disappear
          const barWidth = 1 - progress * (1 - minBarWidth); // from 1 to minBarWidth
          const leftOffset = (1 - barWidth) / 2; // as percent
          // Light moves from left to right within the shrinking bar
          const lightPos = leftOffset + barWidth * progress;
          return (
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 h-4 flex items-center"
              style={{
                width: "75%",
                pointerEvents: "none",
                zIndex: 10,
                position: "absolute",
              }}
            >
              <div
                className="h-2 rounded-full"
                style={{
                  position: "absolute",
                  left: `${leftOffset * 100}%`,
                  width: `${barWidth * 100}%`,
                  background:
                    "linear-gradient(90deg, transparent 0%, #34d399 30%, #059669 50%, #34d399 70%, transparent 100%)",
                  filter: "blur(0.5px)",
                  transition: "left 0.2s linear, width 0.2s linear",
                }}
              ></div>
            </div>
          );
        })()}
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg text-slate-400">Question {idx + 1}</div>
          <Timer seconds={timerLeft} paused={paused} />
        </div>
        <div className="mb-4 flex justify-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={`inline-block w-6 h-6 rounded-full border-2 ${i < health ? "bg-red-400 border-red-400" : "bg-slate-800 border-slate-700"}`}
            ></span>
          ))}
        </div>
        <button
          className={`mb-4 px-4 py-2 rounded bg-emerald-700 text-white font-bold transition ${paused ? "bg-yellow-500 text-slate-900" : ""}`}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        {paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-20">
            <div className="text-4xl font-bold text-emerald-400 mb-4">
              Paused
            </div>
            <div className="text-2xl mb-2">
              Score: <span className="text-emerald-400">{score}</span>
            </div>
            <div className="mb-4 flex justify-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={`inline-block w-8 h-8 rounded-full border-2 ${i < health ? "bg-red-400 border-red-400" : "bg-slate-800 border-slate-700"}`}
                ></span>
              ))}
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                className="px-8 py-3 rounded bg-emerald-400 text-slate-950 font-bold text-xl hover:bg-emerald-500 transition"
                onClick={() => setPaused(false)}
              >
                Resume
              </button>

              <button
                className="px-6 py-2 rounded bg-slate-700 text-slate-200 hover:bg-slate-600 transition"
                onClick={() => {
                  // navigate home
                  try {
                    window.location.href = "/";
                  } catch (e) {
                    // fallback
                    window.location.assign("/");
                  }
                }}
              >
                Back Home
              </button>

              <div className="text-lg text-slate-300 mt-2">
                Press Resume to continue or Back Home to quit
              </div>
            </div>
          </div>
        )}
        <div
          className={paused ? "pointer-events-none select-none opacity-40" : ""}
        >
          <Question
            question={q.question}
            logo_path={q.logo_path}
            hint={q.hint}
            choices={
              Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices)
            }
            onAnswer={handleAnswer}
            showLogo={true}
          />
          {(answered || expired) && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div
                className={`px-6 py-4 rounded-xl text-3xl font-extrabold shadow-xl ${
                  lastCorrect
                    ? "bg-emerald-500 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {expired
                  ? `Time's up — Correct: ${String(q.answer)}`
                  : lastCorrect
                    ? "Correct!"
                    : `Wrong — Correct: ${String(q.answer)}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
