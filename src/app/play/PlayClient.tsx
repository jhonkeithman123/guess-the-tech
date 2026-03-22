"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Question from "@/components/ui/Question";
import Timer from "@/components/ui/Timer";

function getTimerForIndex(idx: number) {
  if (idx < 30) return 10;
  if (idx < 40) return 8;
  if (idx < 50) return 6;
  if (idx < 60) return 5;
  return 4;
}

export default function PlayClient() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  function getTimerForIndex(idx: number) {
    if (idx < 30) return 10;
    if (idx < 40) return 8;
    if (idx < 50) return 6;
    if (idx < 60) return 5;
    return 4;
  }

  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
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

  // Track last 20 question indices to avoid repeats
  const [history, setHistory] = useState<number[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
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
      });
  }, []);

  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  // Helper to get a random question index not in last 20
  function getNextQuestionIdx() {
    if (!allQuestions.length) return 0;
    const recent = new Set(history.slice(-20));
    let tries = 0;
    let idx;
    do {
      idx = Math.floor(Math.random() * allQuestions.length);
      tries++;
    } while (recent.has(idx) && tries < 50);
    return idx;
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
      }, 800);
    },
    [answered, idx, questions, paused, health, allQuestions, history],
  );

  const handleExpire = useCallback(() => {
    setExpired(true);
    setTimeout(() => {
      setAnswered(false);
      // Unlimited questions: always fetch next
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
    }, 800);
  }, [allQuestions, history]);

  // Hydration fix: only render on client
  if (!isClient) return null;
  // Username prompt
  if (!username) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <form
          className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-10 space-y-6 text-center"
          onSubmit={(e) => {
            e.preventDefault();
            if (usernameInput.trim()) setUsername(usernameInput.trim());
          }}
        >
          <h2 className="text-3xl font-bold text-emerald-400 mb-4">
            Enter your username
          </h2>
          <input
            className="px-4 py-2 rounded bg-slate-800 border border-slate-700 text-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Username"
            maxLength={24}
            autoFocus
          />
          <div className="flex flex-row justify-center gap-4 mt-4">
            <button
              type="submit"
              className="px-6 py-2 rounded bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-500 transition"
            >
              Continue
            </button>
            <button
              type="button"
              className="px-6 py-2 rounded bg-slate-700 text-slate-200 font-bold hover:bg-slate-600 transition"
              onClick={() => (window.location.href = "/")}
            >
              Exit
            </button>
          </div>
        </form>
      </main>
    );
  }

  // Standby screen
  if (!standby) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-10 space-y-6 text-center">
          <h2 className="text-4xl font-bold text-emerald-400 mb-4">
            Welcome, {username}!
          </h2>
          <div className="text-xl mb-4">Get ready to play Guess the Tech!</div>
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
              className="px-8 py-3 rounded bg-emerald-400 text-slate-950 font-bold text-xl hover:bg-emerald-500 transition"
              onClick={() => setStandby(true)}
            >
              Start Quiz
            </button>
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
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-2xl animate-pulse">Loading questions...</div>
      </main>
    );
  }

  // (removed duplicate, now at top level)
  if (showResult) {
    if (!showUserPrompt) {
      setTimeout(() => setShowUserPrompt(true), 100); // trigger prompt after render
      return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
          <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-10 space-y-6 text-center">
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
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200">
        <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-10 space-y-6 text-center">
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
  const timer = getTimerForIndex(idx);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-200 font-mono p-4">
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-12 space-y-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-linear-to-r from-transparent via-emerald-500 to-transparent"></div>
        <div className="flex justify-between items-center mb-4">
          <div className="text-lg text-slate-400">
            Question {idx + 1} / {questions.length}
          </div>
          <Timer
            key={idx}
            seconds={timer}
            onExpire={handleExpire}
            paused={paused}
          />
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
