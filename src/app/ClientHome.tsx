"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import audioManager from "@/lib/audio";

import {
  Code2,
  MonitorPlay,
  Trophy,
  Timer,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  Volume2,
  Music,
} from "lucide-react";
import { Logo } from "@/components/server/Logo";

function MusicSelector() {
  const [manifest, setManifest] = useState({ music: [], sfx: {} } as any);
  const [selected, setSelected] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  // list only background music (under /bg_music/) from manifest.music
  const bgList = (manifest.music || []).filter((p: string) =>
    p.includes("/bg_music/"),
  );

  useEffect(() => {
    let mounted = true;
    async function load() {
      await audioManager.loadManifest();
      const m = (audioManager as any).manifest;
      if (!mounted) return;
      setManifest(m || { music: [], sfx: {} });
      // load persisted selection if present
      const persisted =
        typeof window !== "undefined" &&
        localStorage.getItem("gtt_selected_music");
      const defaultName = "/audio/bg_music/what_bottom_text_music.mp3";
      const available = (m?.music || []).filter((p: string) =>
        p.includes("/bg_music/"),
      );
      const defaultUrl =
        persisted ||
        (available.includes(defaultName) ? defaultName : available[0] || null);
      setSelected(defaultUrl);
      if (defaultUrl) {
        // attempt to autoplay
        await audioManager.playMusic(defaultUrl).catch(() => {});
        setPlaying(true);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const [volume, setVolume] = useState<number>(
    audioManager ? audioManager.musicVolume : 50,
  );

  // Dropdown open state + ref for outside click handling
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function selectTrack(url: string | null) {
    setSelected(url);
    try {
      if (url) {
        localStorage.setItem("gtt_selected_music", url);
        await audioManager.playMusic(url);
        setPlaying(true);
      } else {
        localStorage.removeItem("gtt_selected_music");
        audioManager.stopMusic();
        setPlaying(false);
      }
    } catch (e) {}
  }

  return (
    <div className="flex items-center">
      <div
        className="flex items-center gap-3 px-3 py-1 sm:px-4 sm:py-2 rounded-full shadow-md"
        style={{
          backgroundImage: "linear-gradient(135deg, #2b7be0, #2aa06b)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Music className="text-white" />

        {/* Custom dropdown for themed track list */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((s) => !s)}
            aria-expanded={menuOpen}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1 rounded text-white text-sm sm:text-base min-w-[140px]"
          >
            <span className="truncate max-w-[180px] text-sm sm:text-base">
              {selected ? selected.split("/").pop() : "(No music)"}
            </span>
            <span className="text-white/90">▾</span>
          </button>

          {menuOpen && (
            <ul className="absolute left-0 mt-2 w-56 sm:w-72 max-h-56 overflow-auto rounded bg-black/80 border border-white/5 shadow-lg z-50 py-1">
              <li
                className="px-3 py-2 text-sm text-white/90 hover:bg-white/5 cursor-pointer"
                onClick={() => {
                  selectTrack(null);
                  setMenuOpen(false);
                }}
              >
                (No music)
              </li>
              {bgList.map((m: string) => (
                <li
                  key={m}
                  className="px-3 py-2 text-sm text-white/90 hover:bg-white/5 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    selectTrack(m);
                    setMenuOpen(false);
                  }}
                >
                  <span className="truncate max-w-[220px]">
                    {m.split("/").pop()}
                  </span>
                  {selected === m && (
                    <span className="text-emerald-400 ml-2">✓</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="ml-2 flex items-center gap-2">
          <button
            title={playing ? "Stop music" : "Play music"}
            onClick={() => {
              if (playing) {
                audioManager.stopMusic();
                setPlaying(false);
                localStorage.removeItem("gtt_selected_music");
              } else if (selected) {
                audioManager.playMusic(selected);
                setPlaying(true);
                localStorage.setItem("gtt_selected_music", selected);
              }
            }}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded bg-white/10 hover:bg-white/20 transition"
          >
            {playing ? (
              <Pause className="text-white" />
            ) : (
              <Play className="text-white" />
            )}
          </button>

          <div className="flex items-center gap-1 px-2 bg-white/10 rounded">
            <Volume2 className="text-white/80" />
            <input
              aria-label="music volume"
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setVolume(v);
                audioManager.setMusicVolume(v);
              }}
              className="h-2 w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientHome() {
  const colors = {
    blue: "#3367C7",
    red: "#C33D2F",
    yellow: "#D6A72A",
    green: "#2F8F49",
  };

  function ensurePlay() {
    try {
      const sel =
        typeof window !== "undefined"
          ? localStorage.getItem("gtt_selected_music")
          : null;
      if (sel) audioManager.playMusic(sel).catch(() => {});
      else
        audioManager
          .loadManifest()
          .then(() => audioManager.playMusic().catch(() => {}));
    } catch (e) {}
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-transparent text-gray-200 overflow-x-hidden font-sans">
      <div className="aurora-background" />

      {/* HEADER */}
      <header className="w-full px-4 md:px-12 py-4 sm:py-6 flex justify-between items-center glass-card sticky top-0 z-50 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-full transform hover:scale-105 transition-transform duration-100 cursor-pointer"
          >
            <Logo />
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-200">
            <MusicSelector />
          </div>
          <Link href="/play">
            <button
              className="group inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-px cursor-pointer"
              style={{
                backgroundImage: `linear-gradient(135deg, ${colors.blue}, ${colors.green})`,
              }}
              onClick={() => ensurePlay()}
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
        <section className="relative w-full pt-16 sm:pt-24 pb-24 sm:pb-40 px-4 flex flex-col items-center justify-center min-h-[65vh] sm:min-h-[80vh]">
          {/* Hero Content */}
          <div className="relative z-10 text-center max-w-5xl mx-auto space-y-10 p-12 rounded-3xl glass-card animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-500/10 text-blue-300 text-sm font-bold tracking-wide animate-fade-in-up border border-blue-500/20">
              <Sparkles size={16} fill="currentColor" />
              <span>GDG PUP</span>
            </div>

            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.95] gdg-green-gradient animate-fade-in-up">
              LEARN.
              <br />
              PLAY.
              <br />
              GUESS.
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
              The ultimate GDG-themed quiz game. Identify technologies by logos
              or hints, face progressive difficulty, and climb the Top 100
              leaderboard!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center pt-6 sm:pt-10 animate-fade-in-up">
              <Link href="/play" className="w-full sm:w-auto">
                <button
                  className="inline-flex h-16 sm:h-20 min-h-14 w-full items-center justify-center rounded-2xl px-8 sm:px-12 text-lg sm:text-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] hover:shadow-xl sm:w-auto animate-fade-in-up"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${colors.blue}, ${colors.green})`,
                  }}
                  onClick={() => ensurePlay()}
                >
                  Start Game
                </button>
              </Link>
              <Link href="/leaderboard" className="w-full sm:w-auto">
                <button className="group inline-flex h-16 sm:h-20 min-h-14 w-full items-center justify-center gap-3 rounded-2xl border-2 border-gray-600 bg-white/10 px-6 sm:px-10 text-lg sm:text-xl font-bold text-gray-200 transition-all transform hover:scale-[1.02] hover:border-gray-500 hover:bg-white/20 hover:shadow-lg hover:shadow-yellow-400/50 sm:w-auto animate-fade-in-up">
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
            <div className="p-6 sm:p-10 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md animate-fade-in-up"
                style={{ backgroundColor: colors.blue }}
              >
                <Code2 size={32} />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white animate-fade-in-up">
                Flash Logos & Hints
              </h3>
              <p className="text-gray-300 font-medium animate-fade-in-up">
                Identify technologies through rapid-fire logos or challenging
                text clues.
              </p>
            </div>

            <div className="p-6 sm:p-10 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md animate-fade-in-up"
                style={{ backgroundColor: colors.red }}
              >
                <Timer size={32} />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white animate-fade-in-up">
                Progressive Difficulty
              </h3>
              <p className="text-gray-300 font-medium animate-fade-in-up">
                The timer drops as you advance. Start with 10 seconds, but
                survive the boss rounds with just 1 second!
              </p>
            </div>

            <div className="p-6 sm:p-10 rounded-3xl glass-card hover:-translate-y-2 transition-transform duration-300 animate-fade-in-up">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white shadow-md animate-fade-in-up"
                style={{ backgroundColor: colors.yellow }}
              >
                <Trophy size={32} />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-white animate-fade-in-up">
                Top 100 Leaderboard
              </h3>
              <p className="text-gray-300 font-medium animate-fade-in-up">
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
