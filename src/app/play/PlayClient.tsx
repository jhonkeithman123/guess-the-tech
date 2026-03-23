"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Timer from "@/components/client/ui/Timer";
import Question from "@/components/client/ui/Question";

export default function PlayClient() {
  function getTimerForIndex(i: number) {
    if (i >= 130) return 1;
    if (i >= 100) return 2;
    if (i >= 70) return 4;
    if (i >= 50) return 5;
    if (i >= 30) return 6;
    return 8;
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
  const [standby, setStandby] = useState(false);
  // Moved to top level to fix hook order
  const [showUserPrompt, setShowUserPrompt] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  // Timer progress for green light (must be before any return)
  const timer = getTimerForIndex(idx);
  const [timerLeft, setTimerLeft] = useState(timer);
  // For smooth animation
  const [smoothProgress, setSmoothProgress] = useState(0); // 0=start, 1=end
  // Precise end time for rAF-driven countdown
  const [endTime, setEndTime] = useState<number | null>(null);
  const pausedRemainingRef = useRef<number | null>(null);

  // When idx changes (new question), reset timerLeft and smoothProgress
  useEffect(() => {
    setTimerLeft(timer);
    setSmoothProgress(0);
    // only set endTime when the game is active to avoid stale expired times
    if (standby) {
      setEndTime(performance.now() + timer * 1000);
    }
  }, [idx, timer]);

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
  // When the game ends, ensure the timer stops and no further expire actions occur
  useEffect(() => {
    if (!showResult) return;
    // clear any running countdown
    setEndTime(null);
    // pause UI interactions
    setPaused(true);
    // prevent any further expire handling
    expireRef.current = true;
  }, [showResult]);
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
      } else {
        setHealth((h) => h - 1);
      }
      setTimeout(() => {
        setAnswered(false);
        setExpired(false);
        setPaused(false);
        setLastCorrect(null);
        if (!correct && health - 1 <= 0) {
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
      const nh = h - 1;
      if (nh <= 0) {
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
            onSubmit={(e) => {
              e.preventDefault();
              if (usernameInput.trim()) {
                setUsername(usernameInput.trim());
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
            <button
              className="px-8 py-3 rounded bg-emerald-400 text-slate-950 font-bold text-xl hover:bg-emerald-500 transition mb-2"
              onClick={() => setPaused(false)}
            >
              Resume
            </button>
            <div className="text-lg text-slate-300 mb-2">
              Press Resume to continue
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
          {expired && (
            <div className="text-red-400 font-bold mt-4">Time's up!</div>
          )}
          {answered && !expired && lastCorrect === true && (
            <div className="text-emerald-400 font-bold mt-4">Correct!</div>
          )}
          {answered && !expired && lastCorrect === false && (
            <div className="text-red-400 font-bold mt-4">Wrong!</div>
          )}
        </div>
      </div>
    </main>
  );
}
