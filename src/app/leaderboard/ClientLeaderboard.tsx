"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/server/Logo";

type LeaderboardRow = {
  player_name: string;
  score: number;
  email?: string | null;
  time_taken: number;
  timestamp: string;
};

const colors = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC04",
  green: "#34D399",
};

export default function ClientLeaderboard() {
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<LeaderboardRow[]>("/api/leaderboard")
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch leaderboard", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-transparent text-gray-200 overflow-x-hidden font-sans">
      <div className="aurora-background" />

      {/* HEADER */}
      <header className="w-full px-6 md:px-12 py-6 flex justify-between items-center glass-card sticky top-0 z-50 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-full transform hover:scale-105 transition-transform duration-100 cursor-pointer"
          >
            <Logo />
          </Link>
        </div>
        <nav>
          <Link href="/play">
            <button
              className="group inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-px cursor-pointer"
              style={{
                backgroundImage: `linear-gradient(135deg, ${colors.blue}, ${colors.green})`,
              }}
            >
              Play Now
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          </Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="grow flex flex-col z-10">
        <section className="relative w-full pt-12 pb-32 px-4 flex flex-col items-center justify-start min-h-[80vh]">
          <div className="relative z-10 text-center max-w-5xl mx-auto space-y-6 w-full mt-10">
            <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 shadow-sm text-gray-200 text-sm font-bold tracking-wide animate-fade-in-up border border-white/20">
              <Trophy size={18} style={{ color: colors.yellow }} />
              <span>Leaderboard</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-linear-to-r from-gray-200 to-gray-400 pb-2 animate-fade-in-up">
              HALL OF FAME
            </h1>

            {/* DYNAMIC LEADERBOARD TABLE */}
            <div
              className="mt-12 glass-card rounded-3xl shadow-xl overflow-hidden border border-gray-700 max-w-4xl mx-auto animate-fade-in-up relative"
              style={{ animationDelay: "0.05s" }}
            >
              {/* Google Colors Top Strip */}
              <div className="absolute top-0 left-0 w-full h-1.5 flex">
                <div
                  className="h-full flex-1"
                  style={{ backgroundColor: colors.blue }}
                ></div>
                <div
                  className="h-full flex-1"
                  style={{ backgroundColor: colors.red }}
                ></div>
                <div
                  className="h-full flex-1"
                  style={{ backgroundColor: colors.yellow }}
                ></div>
                <div
                  className="h-full flex-1"
                  style={{ backgroundColor: colors.green }}
                ></div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-150">
                  <thead className="border-b border-gray-700">
                    <tr className="text-gray-400 uppercase text-xs tracking-wider">
                      <th className="p-6 font-bold text-center w-24">Rank</th>
                      <th className="p-6 font-bold">Player</th>
                      <th className="p-6 font-bold text-center">Score</th>
                      <th className="p-6 font-bold text-center">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-16 text-center">
                          <div className="flex justify-center items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full animate-bounce"
                              style={{ backgroundColor: colors.blue }}
                            ></div>
                            <div
                              className="w-3 h-3 rounded-full animate-bounce"
                              style={{
                                backgroundColor: colors.red,
                                animationDelay: "0.1s",
                              }}
                            ></div>
                            <div
                              className="w-3 h-3 rounded-full animate-bounce"
                              style={{
                                backgroundColor: colors.yellow,
                                animationDelay: "0.2s",
                              }}
                            ></div>
                            <div
                              className="w-3 h-3 rounded-full animate-bounce"
                              style={{
                                backgroundColor: colors.green,
                                animationDelay: "0.3s",
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ) : data.length > 0 ? (
                      data.map((row, i) => (
                        <tr
                          key={row.timestamp}
                          className="border-b border-gray-800 hover:bg-white/10 transition-colors animate-fade-in-up"
                          style={{ animationDelay: `${i * 0.04}s` }}
                        >
                          <td className="p-5 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                i === 0
                                  ? "bg-gdg-yellow text-white shadow-md shadow-yellow-500/50"
                                  : i === 1
                                    ? "bg-gdg-blue text-white shadow-md shadow-blue-500/50"
                                    : i === 2
                                      ? "bg-gdg-green text-white shadow-md shadow-green-500/50"
                                      : "bg-gray-700 text-gray-200"
                              }`}
                            >
                              #{i + 1}
                            </span>
                          </td>
                          <td className="p-5 font-bold text-gray-200 text-lg tracking-tight">
                            {row.player_name}
                          </td>
                          <td className="p-5 text-center font-black text-xl">
                            <span
                              className="bg-clip-text text-transparent bg-linear-to-r from-blue-300 to-green-300"
                              style={{
                                WebkitTextStroke: "0.25px rgba(0,0,0,0.6)",
                                textShadow:
                                  "0 0 6px rgba(255,255,255,0.06), 0 1px 0 rgba(0,0,0,0.18)",
                                WebkitFontSmoothing: "antialiased",
                              }}
                            >
                              {row.score} pts
                            </span>
                          </td>
                          <td className="p-5 text-center font-semibold text-gray-400">
                            {row.time_taken}s
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-12 text-center text-gray-500 font-medium"
                        >
                          No scores yet. Be the first to play!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 text-center glass-card relative z-10 mt-auto">
        <p className="text-gray-400 font-medium">
          Made with <span className="text-red-500">❤</span> by GDG On Campus
        </p>
      </footer>
    </div>
  );
}
