"use client";

import Link from "next/link";
import {
  Baby,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  LineChart,
  PartyPopper,
  Target,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

type StepKey = "profil" | "growth" | "milestone" | "task" | "laporan";

const steps: {
  key: StepKey;
  icon: typeof Baby;
  title: string;
  desc: string;
  href: string;
  cta: string;
}[] = [
  {
    key: "profil",
    icon: Baby,
    title: "Lengkapi profil si Kecil",
    desc: "Isi berat & tinggi lahir serta data dasar lainnya.",
    href: "/children",
    cta: "Buka profil",
  },
  {
    key: "growth",
    icon: LineChart,
    title: "Catat tumbuh kembang",
    desc: "Isi berat, tinggi, lingkar kepala, imunisasi, gigi, dan tidur.",
    href: "/growth",
    cta: "Catat sekarang",
  },
  {
    key: "milestone",
    icon: Target,
    title: "Centang milestone",
    desc: "Tandai pencapaian per usia & domain perkembangan anak.",
    href: "/goals",
    cta: "Lihat milestone",
  },
  {
    key: "task",
    icon: ClipboardList,
    title: "Catatan si Kecil",
    desc: "Kelola PR Ibu (sekali beres) dan rutinitas & kebiasaan harian.",
    href: "/catatan",
    cta: "Mulai atur",
  },
  {
    key: "laporan",
    icon: FileText,
    title: "Lihat & bagikan laporan",
    desc: "Buat laporan perkembangan untuk dibawa ke dokter.",
    href: "/reports",
    cta: "Buka laporan",
  },
];

export function DashboardGuide() {
  const show = useAppStore((s) => s.showGuide);
  const dismiss = useAppStore((s) => s.dismissGuide);
  const activeId = useAppStore((s) => s.activeChildId);
  const children = useAppStore((s) => s.children);
  const growth = useAppStore((s) => s.growth);
  const milestones = useAppStore((s) => s.milestones);
  const tasks = useAppStore((s) => s.tasks);
  const habits = useAppStore((s) => s.habits);

  if (!show) return null;

  // Derive each step's completion from real data so the checklist self-updates.
  const child = children.find((c) => c.id === activeId);
  const hasGrowth = (growth[activeId]?.length ?? 0) > 0;
  const done: Record<StepKey, boolean> = {
    profil: !!(child?.birthWeight || child?.birthHeight),
    growth: hasGrowth,
    milestone: (milestones[activeId] ?? []).some((m) => m.status === "bisa"),
    task: tasks.length > 0 || habits.length > 0,
    laporan: hasGrowth,
  };
  const completed = steps.filter((s) => done[s.key]).length;
  const pct = Math.round((completed / steps.length) * 100);
  const allDone = completed === steps.length;

  return (
    <Card className="relative overflow-hidden border-gold-200 bg-gradient-to-br from-gold-50 via-cream/60 to-background">
      <button
        onClick={dismiss}
        aria-label="Tutup panduan"
        className="absolute right-4 top-4 rounded-full p-1.5 text-navy-muted transition-colors hover:bg-white/60 hover:text-navy"
      >
        <X className="h-4 w-4" />
      </button>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500 text-navy">
            {allDone ? (
              <PartyPopper className="h-5 w-5" />
            ) : (
              <BookOpen className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-extrabold text-navy">
              {allDone
                ? "Semua langkah selesai! 🎉"
                : "Selamat datang di Jurnal Emas Si Kecil 👋"}
            </p>
            <p className="text-sm text-navy-muted">
              {allDone
                ? "Kamu sudah menyiapkan semuanya. Terus pantau momen emas si Kecil!"
                : "Ikuti langkah-langkah ini agar mudah memulai — satu per satu saja."}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <Progress value={pct} className="h-2 flex-1" />
          <span className="shrink-0 text-xs font-bold text-gold-700">
            {completed}/{steps.length} selesai
          </span>
        </div>

        <ol className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((s, i) => {
            const isDone = done[s.key];
            return (
              <li
                key={s.key}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 transition-colors",
                  isDone
                    ? "border-sage/40 bg-sage-soft/40"
                    : "border-border bg-background/80",
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-sm font-bold",
                    isDone
                      ? "bg-sage text-white"
                      : "bg-gold-100 text-gold-700",
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "flex items-center gap-1.5 text-sm font-bold",
                      isDone ? "text-sage" : "text-navy",
                    )}
                  >
                    <s.icon className="h-4 w-4 shrink-0" /> {s.title}
                  </p>
                  {isDone ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-sage">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Selesai
                    </p>
                  ) : (
                    <>
                      <p className="mt-0.5 text-xs leading-relaxed text-navy-muted">
                        {s.desc}
                      </p>
                      <Link
                        href={s.href}
                        className="mt-2 inline-block text-xs font-semibold text-gold-700 hover:underline"
                      >
                        {s.cta} →
                      </Link>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={dismiss}
            className="shrink-0"
          >
            <Check className="h-4 w-4" />{" "}
            {allDone ? "Tutup panduan" : "Mengerti, sembunyikan panduan"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Bisa dibuka lagi kapan saja dari menu Pengaturan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
