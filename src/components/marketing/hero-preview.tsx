"use client";

import { useRef } from "react";
import {
  CalendarHeart,
  CheckCircle2,
  Download,
  FileText,
  Flame,
  HeartPulse,
  LineChart,
  Share2,
  Sparkles,
  Stethoscope,
  Syringe,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const schedule = [
  { icon: Syringe, color: "text-soft-orange", bg: "bg-soft-orange-soft", label: "Imunisasi DPT-HB-Hib", date: "22 Jun" },
  { icon: Stethoscope, color: "text-sage", bg: "bg-sage-soft", label: "Posyandu bulanan", date: "25 Jun" },
  { icon: Target, color: "text-gold-700", bg: "bg-gold-100", label: "Cek milestone 9 bln", date: "28 Jun" },
];

const report = [
  { label: "Motorik Kasar", pct: 90 },
  { label: "Bahasa & Komunikasi", pct: 70 },
  { label: "Sosial-Emosional", pct: 100 },
];

const growthBars = [38, 50, 46, 60, 68, 64, 78, 86];

/**
 * Interactive dashboard preview for the hero. Tilts subtly toward the cursor
 * (pointer devices, motion-safe) to add depth without a physics library.
 */
export function HeroPreview() {
  const tiltRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = tiltRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
  }
  function reset() {
    if (tiltRef.current) tiltRef.current.style.transform = "perspective(1200px)";
  }

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={reset}
      className="relative mx-auto max-w-md [perspective:1200px]"
    >
      <div
        ref={tiltRef}
        className="relative transition-transform duration-300 ease-out [transform-style:preserve-3d] [will-change:transform]"
      >
        {/* Kartu utama: profil anak + grafik pertumbuhan + milestone (lapisan belakang) */}
        <div className="relative z-10 mx-auto w-[94%] rounded-3xl border border-border/70 bg-card/95 p-5 shadow-2xl shadow-navy/10 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gold-100 text-xl">
                👶
              </div>
              <div>
                <p className="font-display font-bold text-navy">Bintang</p>
                <p className="text-xs text-navy-muted">9 bulan 9 hari</p>
              </div>
            </div>
            <Badge variant="success" className="gap-1">
              <Flame className="h-3 w-3" /> 12 hari
            </Badge>
          </div>

          {/* Grafik pertumbuhan dengan status z-score WHO */}
          <div className="mt-5 rounded-2xl bg-secondary/50 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-navy">
                <LineChart className="h-4 w-4 text-gold-600" /> Berat badan
              </p>
              <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-bold text-sage">
                z-score +0,4 · Normal
              </span>
            </div>
            <div className="mt-3 flex h-16 items-end gap-1.5">
              {growthBars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t from-gold-500 to-gold-300"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Ringkasan milestone & goal */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-navy/[0.04] p-3">
              <HeartPulse className="h-4 w-4 text-sage" />
              <p className="mt-1.5 font-display text-xl font-extrabold text-navy">8/12</p>
              <p className="text-[11px] text-navy-muted">Milestone tercapai</p>
            </div>
            <div className="rounded-2xl bg-navy/[0.04] p-3">
              <Target className="h-4 w-4 text-gold-600" />
              <p className="mt-1.5 font-display text-xl font-extrabold text-navy">60%</p>
              <p className="text-[11px] text-navy-muted">Goal finger food</p>
            </div>
          </div>

          <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-sage">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Status gizi akurat z-score WHO — deteksi dini stunting
          </p>
        </div>

        {/* Kartu kalender + jadwal (lapisan tengah, menutupi sebagian kartu utama) */}
        <div className="relative z-20 mx-auto -mt-20 w-[97%] rounded-3xl border border-border/70 bg-card/95 p-5 shadow-2xl shadow-navy/10 backdrop-blur-sm sm:-mt-24">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 font-display text-sm font-bold text-navy">
              <CalendarHeart className="h-4 w-4 text-gold-600" /> Juni 2026
            </p>
            <span className="text-[11px] font-semibold text-navy-muted">3 jadwal</span>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase text-navy-muted">
            {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-[10px]">
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const marked = [22, 25, 28].includes(day);
              const today = day === 20;
              return (
                <span
                  key={day}
                  className={`grid h-5 place-items-center rounded-full ${
                    today
                      ? "bg-navy font-bold text-cream"
                      : marked
                        ? "bg-gold-100 font-bold text-gold-700"
                        : "text-navy-muted"
                  }`}
                >
                  {day}
                </span>
              );
            })}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-4">
            {schedule.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${s.bg} ${s.color}`}
                >
                  <s.icon className="h-3.5 w-3.5" />
                </span>
                <p className="flex-1 truncate text-xs font-medium text-navy">{s.label}</p>
                <span className="text-[11px] font-semibold text-navy-muted">{s.date}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-sage">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Pengingat otomatis — jadwal imunisasi & posyandu tak terlewat
          </p>
        </div>

        {/* Kartu laporan perkembangan (lapisan depan, menutupi sebagian kartu kalender) */}
        <div className="relative z-30 mx-auto -mt-20 w-full rounded-3xl border border-border/70 bg-card/95 p-5 shadow-2xl shadow-navy/10 backdrop-blur-sm sm:-mt-24">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 font-display text-sm font-bold text-navy">
              <FileText className="h-4 w-4 text-gold-600" /> Laporan Perkembangan
            </p>
            <div className="flex items-center gap-1.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold-100 text-gold-700">
                <Download className="h-3.5 w-3.5" />
              </span>
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-navy/[0.06] text-navy">
                <Share2 className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {report.map((d) => (
              <div key={d.label}>
                <div className="flex items-center justify-between text-[11px] font-medium text-navy">
                  <span>{d.label}</span>
                  <span className="text-navy-muted">{d.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy/[0.07]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-sage">
            <Share2 className="h-3.5 w-3.5 shrink-0" /> Bagikan link read-only ke dokter — tanpa login
          </p>
        </div>
      </div>

      {/* Chip Pendamping AI mengambang (kiri-atas) */}
      <div className="absolute -left-5 top-[26%] z-40 hidden rounded-2xl border border-border/70 bg-background/90 px-3.5 py-2.5 shadow-xl backdrop-blur-sm motion-safe:animate-float sm:block">
        <p className="flex items-center gap-2 text-xs font-semibold text-navy">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-100">
            <Sparkles className="h-3.5 w-3.5 text-gold-600" />
          </span>
          Pendamping AI siap menjawab
        </p>
      </div>

      {/* Chip skor mengambang (kanan-bawah) */}
      <div className="absolute -right-4 bottom-[16%] z-40 hidden rounded-2xl border border-border/70 bg-background/90 px-3.5 py-2.5 shadow-xl backdrop-blur-sm motion-safe:animate-float-slow lg:block">
        <p className="flex items-center gap-2 text-xs font-semibold text-navy">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-sage-soft">
            <CheckCircle2 className="h-3.5 w-3.5 text-sage" />
          </span>
          Tumbuh sesuai usia
        </p>
      </div>
    </div>
  );
}
