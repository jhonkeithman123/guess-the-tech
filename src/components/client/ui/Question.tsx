"use client";

import React, { useEffect } from "react";

interface QuestionProps {
  question: string;
  logo_path: string;
  hint: string;
  choices: string[];
  onAnswer: (choice: string) => void;
  showLogo?: boolean;
}

export default function Question({
  question,
  logo_path,
  hint,
  choices,
  onAnswer,
  showLogo = true,
}: QuestionProps) {
  // Encode each path segment to ensure characters like '#' are percent-encoded
  const safePath = logo_path
    ? logo_path
        .split("/")
        .map((seg) => encodeURIComponent(seg))
        .join("/")
    : "";

  const imgSize = 160; // px
  useEffect(() => {
    if (safePath && showLogo) {
      // Log the resolved/encoded path so we can debug broken images like C#
      // Visible in browser console and server logs when rendering on client
      // eslint-disable-next-line no-console
      console.log("[Question] showing logo:", safePath);
    }
  }, [safePath, showLogo]);

  return (
    <div className="space-y-6">
      {showLogo && logo_path && (
        <div className="relative flex items-center justify-center mx-auto h-48 w-48">
          {/* White platform for visibility (now a square) */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white w-44 h-44 shadow-md z-0 rounded"
            style={{ filter: "blur(1.5px)" }}
          ></div>
          {/* Use <img> for SVGs too but ensure path is URI-encoded to avoid '#' issues */}
          <img
            src={safePath}
            alt="logo"
            className="relative z-10 h-40 w-40 object-contain"
            style={{ display: "block" }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              // fallback: try a likely alternate filename (CS.svg) if C#.svg missing
              if (!el.dataset.fallbackTried) {
                // eslint-disable-next-line no-console
                console.warn(
                  "[Question] image load failed, trying fallback for",
                  el.src,
                );
                el.dataset.fallbackTried = "1";
                const parts = el.src.split("/");
                parts[parts.length - 1] = "CS.svg";
                el.src = parts.join("/");
              }
            }}
          />
        </div>
      )}
      <div className="text-3xl font-semibold mb-2">{question}</div>
      <div className="text-lg text-slate-400 mb-4">{hint}</div>
      <div className="grid grid-cols-2 gap-4">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => onAnswer(choice)}
            className="px-6 py-4 text-lg rounded bg-slate-800 hover:bg-emerald-500 hover:text-slate-900 transition-colors border border-slate-700 font-mono"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
