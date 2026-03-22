"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Code2,
  MonitorPlay,
  Trophy,
  Timer,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function ClientHome() {
  const colors = {
    blue: "#4285F4",
    red: "#EA4335",
    yellow: "#FBBC04",
    green: "#34A853",
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-transparent text-gray-200 overflow-x-hidden font-sans">
      <div className="aurora-background" />

      {/* HEADER */}
      <header className="w-full px-6 md:px-12 py-6 flex justify-between items-center glass-card sticky top-0 z-50">
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
      <main className="grow flex flex-col">
        {/* HERO SECTION */}
        <section className="relative w-full pt-24 pb-40 px-4 flex flex-col items-center justify-center min-h-[80vh]">
          {/* Hero Content */}
          <div className="relative z-10 text-center max-w-5xl mx-auto space-y-10 p-12 rounded-3xl glass-card">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/10 text-blue-300 text-sm font-bold tracking-wide animate-fade-in-up border border-blue-500/20">
              <Sparkles size={16} fill="currentColor" />
              <span>GDG PUP</span>
            </div>

            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.9] gdg-text-gradient">
              LEARN.
              <br />
              PLAY.
              <br />
              BUILD.
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              The ultimate GDG-themed quiz game. Identify technologies by logos
              or hints, face progressive difficulty, and climb the Top 100
              leaderboard!
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
              <Link href="/play" className="w-full sm:w-auto">
                <button
                  className="inline-flex h-20 w-full items-center justify-center rounded-2xl px-12 text-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] hover:shadow-xl sm:w-auto"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${colors.blue}, ${colors.green})`,
                  }}
                >
                  Start Game
                </button>
              </Link>
              <Link href="/leaderboard" className="w-full sm:w-auto">
                <button className="group inline-flex h-20 w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-600 bg-white/10 px-10 text-xl font-bold text-gray-200 transition-all transform hover:scale-[1.02] hover:border-gray-500 hover:bg-white/20 hover:shadow-lg hover:shadow-yellow-400/50 sm:w-auto">
                  <Trophy
                    size={24}
                    className="text-yellow-400 transition-transform group-hover:scale-110"
                  />
                  Top 100 Leaderboard
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="w-full max-w-7xl mx-auto px-4 pb-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="p-10 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md"
                style={{ backgroundColor: colors.blue }}
              >
                <Code2 size={32} />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white">
                Flash Logos & Hints
              </h3>
              <p className="text-gray-300 font-medium">
                Identify technologies through rapid-fire logos or challenging
                text clues.
              </p>
            </div>

            <div className="p-10 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md"
                style={{ backgroundColor: colors.red }}
              >
                <Timer size={32} />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white">
                Progressive Difficulty
              </h3>
              <p className="text-gray-300 font-medium">
                The timer drops as you advance. Start with 10 seconds, but
                survive the boss rounds with just 4 seconds!
              </p>
            </div>

            <div className="p-10 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md"
                style={{ backgroundColor: colors.yellow }}
              >
                <Trophy size={32} />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white">
                Top 100 Leaderboard
              </h3>
              <p className="text-gray-300 font-medium">
                Earn bonus points for accuracy and streaks. Race against the
                clock and claim your spot in the Top 100.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-12 text-center glass-card relative z-10">
        <p className="text-gray-400 font-medium">
          Made with <span style={{ color: colors.red }}>❤</span> by GDG On
          Campus
        </p>
      </footer>
    </div>
  );
}
