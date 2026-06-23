"use client";

import Link from "next/link";
import {
  Baby,
  BookOpen,
  Check,
  ClipboardList,
  FileText,
  LineChart,
  Target,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

const steps = [
  {
    icon: Baby,
    title: "Lengkapi profil si Kecil",
    desc: "Pastikan nama, tanggal lahir, dan data dasar sudah benar.",
    href: "/children",
    cta: "Buka profil",
  },
  {
    icon: LineChart,
    title: "Catat tumbuh kembang",
    desc: "Isi berat, tinggi, lingkar kepala, imunisasi, gigi, dan tidur.",
    href: "/growth",
    cta: "Catat sekarang",
  },
  {
    icon: Target,
    title: "Centang milestone",
    desc: "Tandai pencapaian per usia & domain perkembangan anak.",
    href: "/goals",
    cta: "Lihat milestone",
  },
  {
    icon: ClipboardList,
    title: "Atur task & rutinitas",
    desc: "Kelola tugas sekali-jadi dan rutinitas harian yang berulang.",
    href: "/tasks",
    cta: "Mulai atur",
  },
  {
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
  if (!show) return null;

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
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500 text-navy">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-navy">
              Selamat datang di Jurnal Emas Si Kecil 👋
            </p>
            <p className="text-sm text-navy-muted">
              Ikuti 5 langkah ini agar mudah memulai — tidak perlu sekaligus, satu
              per satu saja.
            </p>
          </div>
        </div>

        <ol className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="flex items-start gap-3 rounded-2xl border bg-background/80 p-4"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gold-100 font-display text-sm font-bold text-gold-700">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-bold text-navy">
                  <s.icon className="h-4 w-4 text-gold-600" /> {s.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-navy-muted">
                  {s.desc}
                </p>
                <Link
                  href={s.href}
                  className="mt-2 inline-block text-xs font-semibold text-gold-700 hover:underline"
                >
                  {s.cta} →
                </Link>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={dismiss}>
            <Check className="h-4 w-4" /> Mengerti, sembunyikan panduan
          </Button>
          <p className="text-xs text-muted-foreground">
            Bisa dibuka lagi kapan saja dari menu Pengaturan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
