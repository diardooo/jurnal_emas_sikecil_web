"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatRupiah } from "@/lib/utils";

const freeFeatures = [
  "1 profil anak",
  "Milestone & pertumbuhan z-score WHO lengkap",
  "Task, rutinitas & Jurnal Emas (tanpa foto)",
  "Pendamping AI — 3 pertanyaan/hari",
  "Pengingat imunisasi & posyandu",
];

const premiumFeatures = [
  "Profil anak tak terbatas",
  "Foto di Jurnal & milestone",
  "Pendamping AI — kuota harian penuh",
  "Export PDF & bagikan laporan via link",
  "Semua fitur paket Gratis",
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const monthly = 49000;
  const yearly = 399000;
  const price = annual ? yearly : monthly;

  return (
    <section id="harga" className="border-t border-border bg-secondary/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="gold" className="mb-4">
            Harga
          </Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Mulai gratis, upgrade saat siap
          </h2>
          <p className="mt-3 text-navy-muted">
            Gratis selamanya untuk memulai. Upgrade ke Premium kapan saja — sekali
            bayar, tanpa langganan otomatis.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-background p-1.5 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                !annual ? "bg-primary text-primary-foreground" : "text-navy-muted",
              )}
            >
              Bulanan
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                annual ? "bg-primary text-primary-foreground" : "text-navy-muted",
              )}
            >
              Tahunan
              <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[11px] text-sage">
                Hemat 32%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-12 grid grid-cols-1 max-w-4xl gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-3xl border bg-background p-8">
            <h3 className="font-display text-xl font-bold text-navy">Gratis</h3>
            <p className="mt-1 text-sm text-navy-muted">
              Untuk memulai perjalanan pemantauan
            </p>
            <p className="mt-6">
              <span className="font-display text-4xl font-extrabold text-navy">
                Rp 0
              </span>
              <span className="text-navy-muted">/selamanya</span>
            </p>
            <Button variant="outline" className="mt-6 w-full" asChild>
              <Link href="/register">Mulai Gratis</Link>
            </Button>
            <ul className="mt-8 space-y-3">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-navy-muted">
                  <Check className="h-4 w-4 shrink-0 text-sage" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-gold-400 bg-gradient-to-b from-gold-50 to-background p-8 shadow-lg">
            <div className="absolute right-5 top-5">
              <Badge variant="gold" className="gap-1">
                <Sparkles className="h-3 w-3" /> Paling Populer
              </Badge>
            </div>
            <h3 className="font-display text-xl font-bold text-navy">
              Premium Emas
            </h3>
            <p className="mt-1 text-sm text-navy-muted">
              Pengalaman tumbuh kembang penuh
            </p>
            <p className="mt-6">
              <span className="font-display text-4xl font-extrabold text-navy">
                {formatRupiah(price)}
              </span>
              <span className="text-navy-muted">
                /{annual ? "tahun" : "bulan"}
              </span>
            </p>
            <Button className="mt-6 w-full" asChild>
              <Link href="/register">Mulai & Upgrade ke Premium</Link>
            </Button>
            <ul className="mt-8 space-y-3">
              {premiumFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-medium text-navy">
                  <Check className="h-4 w-4 shrink-0 text-gold-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
