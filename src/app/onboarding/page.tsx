"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Check,
  PartyPopper,
  Ruler,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/types";

const steps = [
  { id: 1, title: "Tentang si Kecil", icon: Baby },
  { id: 2, title: "Data Kelahiran", icon: Ruler },
  { id: 3, title: "Selesai", icon: PartyPopper },
];

export default function OnboardingPage() {
  const router = useRouter();
  const addChild = useAppStore((s) => s.addChild);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<Gender>("L");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  function next() {
    if (step === 1 && (!name || !dob)) {
      toast.error("Lengkapi nama dan tanggal lahir si Kecil");
      return;
    }
    if (step < 3) setStep(step + 1);
  }

  function finish() {
    addChild({
      id: `c-${Date.now()}`,
      name,
      dob,
      gender,
      birthWeight: weight ? Number(weight) : undefined,
      birthHeight: height ? Number(height) : undefined,
      color: "#C9A227",
      photoUrl: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(name)}`,
    });
    toast.success("Profil si Kecil siap!", {
      description: "Selamat datang di Jurnal Emas Si Kecil.",
    });
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream/40">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-semibold text-navy-muted hover:text-navy"
          >
            Lewati
          </button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg">
          {/* Stepper */}
          <div className="mb-10 flex items-center justify-center">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-full border-2 transition-colors",
                      step > s.id
                        ? "border-sage bg-sage text-white"
                        : step === s.id
                          ? "border-gold-500 bg-gold-500 text-navy"
                          : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {step > s.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-5 w-5" />
                    )}
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 w-16 transition-colors sm:w-24",
                      step > s.id ? "bg-sage" : "bg-border",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="rounded-3xl border bg-background p-8 shadow-sm">
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-navy">
                    Siapa nama si Kecil?
                  </h1>
                  <p className="mt-1 text-sm text-navy-muted">
                    Kami akan menyesuaikan milestone berdasarkan usianya.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Anak</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Bintang"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob">Tanggal Lahir</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Jenis Kelamin</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: "L" as Gender, label: "Laki-laki", emoji: "👦" },
                      { v: "P" as Gender, label: "Perempuan", emoji: "👧" },
                    ].map((g) => (
                      <button
                        key={g.v}
                        type="button"
                        onClick={() => setGender(g.v)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition-colors",
                          gender === g.v
                            ? "border-gold-500 bg-gold-50 text-navy"
                            : "border-border text-navy-muted hover:border-gold-200",
                        )}
                      >
                        <span className="text-lg">{g.emoji}</span>
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-navy">
                    Data kelahiran
                  </h1>
                  <p className="mt-1 text-sm text-navy-muted">
                    Opsional, untuk menampilkan grafik pertumbuhan BB/TB.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="weight">Berat Lahir (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="3.2"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="height">Tinggi Lahir (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="49"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                    />
                  </div>
                </div>
                <div className="rounded-xl bg-secondary/60 p-4 text-sm text-navy-muted">
                  💡 Data ini bisa dilengkapi nanti di halaman Profil Anak.
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5 text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gold-100 text-4xl">
                  🎉
                </div>
                <div>
                  <h1 className="font-display text-2xl font-extrabold text-navy">
                    Semua siap, {name || "Bunda"}!
                  </h1>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-navy-muted">
                    Profil {name || "si Kecil"} telah dibuat. Mari mulai
                    perjalanan memantau momen emas tumbuh kembangnya.
                  </p>
                </div>
                <div className="rounded-2xl border bg-cream/50 p-5 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
                    Ringkasan
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row label="Nama" value={name || "—"} />
                    <Row label="Tanggal lahir" value={dob || "—"} />
                    <Row
                      label="Jenis kelamin"
                      value={gender === "L" ? "Laki-laki" : "Perempuan"}
                    />
                  </dl>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => setStep(step - 1)}>
                  <ArrowLeft /> Kembali
                </Button>
              ) : (
                <span />
              )}
              {step < 3 ? (
                <Button onClick={next}>
                  Lanjut <ArrowRight />
                </Button>
              ) : (
                <Button onClick={finish}>
                  Masuk Dashboard <ArrowRight />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-navy-muted">{label}</dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  );
}
