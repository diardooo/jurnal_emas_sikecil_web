"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/logo";

// Cheerful, rotating status lines shown while the app hydrates. They're playful
// rather than literal — the load is usually quick — to make the wait feel warm.
const MESSAGES = [
  "Menyiapkan jurnal si Kecil…",
  "Menghitung tumbuh kembang…",
  "Menata milestone & rutinitas…",
  "Merapikan momen berharga…",
  "Menghangatkan secangkir semangat ☕",
  "Hampir selesai ✨",
];

// Emojis that gently float around the logo.
const FLOATERS = [
  { e: "🍼", className: "left-0 top-2", delay: "0s" },
  { e: "⭐", className: "right-1 top-0", delay: "0.6s" },
  { e: "🧸", className: "-left-2 bottom-1", delay: "1.1s" },
  { e: "📖", className: "-right-2 bottom-2", delay: "1.6s" },
];

export function LoadingScreen() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setI((n) => (n + 1) % MESSAGES.length),
      1500,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-cream/40 px-6">
      {/* warm gold glow behind everything */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-300/30 blur-3xl animate-blob" />

      <div className="relative flex flex-col items-center text-center">
        {/* Bouncing star logo with floating emojis around it */}
        <div className="relative grid h-28 w-28 place-items-center">
          {FLOATERS.map((f) => (
            <span
              key={f.e}
              className={`absolute text-2xl animate-float-slow ${f.className}`}
              style={{ animationDelay: f.delay }}
              aria-hidden
            >
              {f.e}
            </span>
          ))}
          <div className="animate-float">
            <LogoMark className="h-16 w-16 rounded-3xl shadow-lg" />
          </div>
        </div>

        <p className="mt-6 font-display text-xl font-extrabold">
          <span className="text-gradient-gold animate-gradient-x">
            Jurnal Emas Si Kecil
          </span>
        </p>

        {/* Rotating message — re-keyed so it re-runs the fade each change */}
        <p
          key={i}
          className="mt-2 h-5 animate-fade-in text-sm font-medium text-navy-muted"
        >
          {MESSAGES[i]}
        </p>

        {/* Indeterminate loading bar */}
        <div className="mt-7 h-1.5 w-52 overflow-hidden rounded-full bg-gold-100">
          <div className="h-full w-2/5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 animate-loading-bar" />
        </div>
      </div>
    </div>
  );
}
