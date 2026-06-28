import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Baby,
  CalendarHeart,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Flame,
  HeartPulse,
  LineChart,
  Quote,
  Repeat,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  Target,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Pricing } from "@/components/marketing/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const modules = [
  {
    icon: Sparkles,
    title: "Pendamping AI (Pendamping Emas)",
    desc: "Tanya apa saja soal tumbuh kembang — dijawab dari data anak Anda sendiri (milestone, pertumbuhan, red flag), berbasis pedoman WHO/IDAI. Bukan diagnosis, tapi penenang di tengah malam.",
    color: "bg-gold-100 text-gold-700",
  },
  {
    icon: LineChart,
    title: "Tumbuh Kembang",
    desc: "Grafik berat, tinggi & lingkar kepala dengan status z-score WHO (deteksi stunting/wasting), plus imunisasi (IDAI), gigi, dan pola tidur.",
    color: "bg-gold-100 text-gold-700",
  },
  {
    icon: Target,
    title: "Goal & Milestone",
    desc: "Milestone 0–6 tahun per fase usia & domain (WHO, IDAI/KPSP, Denver II) — dengan deteksi otomatis red flag bila ada keterlambatan kritis.",
    color: "bg-navy/10 text-navy",
  },
  {
    icon: HeartPulse,
    title: "Jurnal Emas",
    desc: "Abadikan momen & catatan harian si Kecil lengkap dengan foto — timeline kenangan yang tumbuh bersama mereka.",
    color: "bg-sage-soft text-sage",
  },
  {
    icon: ClipboardList,
    title: "Task Manager",
    desc: "Urusan sekali-jadi yang punya tenggat (imunisasi, administrasi) — tampilan List, Kanban, & Kalender.",
    color: "bg-soft-orange-soft text-soft-orange",
  },
  {
    icon: Repeat,
    title: "Rutinitas",
    desc: "Checklist harian yang segar tiap pagi + pelacakan kebiasaan dengan streak & heatmap konsistensi.",
    color: "bg-sage-soft text-sage",
  },
  {
    icon: FileText,
    title: "Laporan Perkembangan",
    desc: "Rekap per domain & grafik pertumbuhan — unduh PDF atau bagikan via link read-only langsung ke dokter/nakes, tanpa mereka perlu login.",
    color: "bg-gold-100 text-gold-700",
  },
  {
    icon: Baby,
    title: "Multi-anak & Pengingat",
    desc: "Pantau beberapa anak dalam satu akun, dengan pengingat imunisasi & posyandu otomatis.",
    color: "bg-sage-soft text-sage",
  },
];

const steps = [
  {
    icon: Baby,
    title: "Buat profil si Kecil",
    desc: "Tambahkan data anak dalam wizard 3 langkah, kurang dari 5 menit.",
  },
  {
    icon: CalendarHeart,
    title: "Catat & pantau harian",
    desc: "Isi task, habit, dan milestone dengan satu tap dari dashboard.",
  },
  {
    icon: Activity,
    title: "Lihat perkembangan",
    desc: "Pantau grafik pertumbuhan dan ekspor laporan untuk dibawa ke dokter.",
  },
];

const domains = [
  "Motorik Kasar",
  "Motorik Halus",
  "Kognitif",
  "Bahasa & Komunikasi",
  "Sosial-Emosional",
  "Sensorik",
  "Nutrisi & Pertumbuhan",
];

// Ilustrasi skenario penggunaan (bukan klaim metrik) — menonjolkan fitur nyata.
const testimonials = [
  {
    name: "Rara",
    role: "Ibu baru, anak 8 bulan",
    quote:
      "Tengah malam panik anak belum bisa apa, tanya Pendamping AI-nya — langsung dijawab dari data anak saya sendiri. Tenang seketika.",
  },
  {
    name: "Budi & Sari",
    role: "Orang tua pekerja",
    quote:
      "Grafik pertumbuhannya pakai z-score WHO, jadi tahu status anak beneran. Laporannya tinggal share link ke dokter, tanpa ribet.",
  },
  {
    name: "Dewi",
    role: "Ibu anak prasekolah",
    quote:
      "Deteksi red flag-nya bikin saya nggak menunda ke nakes waktu si Kakak telat bicara. Goal tracker-nya juga rapi untuk persiapan SD.",
  },
];

const stats = [
  { value: "0–6 thn", label: "Rentang usia dipantau" },
  { value: "7", label: "Domain perkembangan" },
  { value: "z-score", label: "Standar WHO untuk pertumbuhan" },
  { value: "AI 24/7", label: "Pendamping berbasis data anak" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-cream/60 bg-grid">
          <div className="container grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
            <div className="animate-fade-in">
              <Badge variant="gold" className="mb-5 gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Pendamping tumbuh kembang ber-AI & berbasis bukti ilmiah
              </Badge>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-6xl text-balance">
                Rayakan setiap{" "}
                <span className="text-gold-600">momen emas</span> tumbuh kembang
                si Kecil
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy-muted">
                Pantau milestone, pertumbuhan z-score WHO, dan rutinitas — plus{" "}
                <span className="font-semibold text-navy">Pendamping AI</span> yang
                menjawab dari data anak Anda sendiri. Berbasis bukti WHO, IDAI &
                Denver.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Mulai Gratis Sekarang
                    <ArrowRight />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/demo">Lihat Demo Dashboard</Link>
                </Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-navy-muted">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sage" /> Gratis untuk memulai
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sage" /> Tanpa kartu kredit
                </span>
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-sage" /> Data anak terenkripsi
                </span>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative animate-fade-in">
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-border bg-navy">
          <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-extrabold text-gold-400">
                  {s.value}
                </p>
                <p className="mt-1 text-sm text-cream/70">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* MODULES / FEATURES */}
        <section id="fitur" className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                Fitur
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Semua kebutuhan tumbuh kembang dalam satu app
              </h2>
              <p className="mt-3 text-navy-muted">
                Dari grafik pertumbuhan WHO sampai rutinitas harian — terpadu,
                berbasis bukti ilmiah, dan menyenangkan dipakai tiap hari.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <div
                  key={m.title}
                  className="group rounded-2xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className={`grid h-12 w-12 place-items-center rounded-xl ${m.color}`}
                  >
                    <m.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold text-navy">
                    {m.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-muted">
                    {m.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DOMAINS STRIP */}
        <section className="border-y border-border bg-secondary/40 py-14">
          <div className="container text-center">
            <h2 className="font-display text-2xl font-bold text-navy">
              Milestone di 7 domain perkembangan
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-navy-muted">
              Ditinjau berdasarkan standar WHO Child Growth, Denver Developmental
              Screening II, dan KPSP IDAI.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {domains.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-gold-200 bg-background px-4 py-2 text-sm font-semibold text-navy"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="cara-kerja" className="py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                Cara Kerja
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Mulai dalam 3 langkah mudah
              </h2>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.title} className="relative text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold-100 text-gold-700">
                    <s.icon className="h-8 w-8" />
                  </div>
                  <span className="mt-4 inline-block font-display text-sm font-bold text-gold-600">
                    Langkah {i + 1}
                  </span>
                  <h3 className="mt-1 font-display text-lg font-bold text-navy">
                    {s.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm text-navy-muted">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimoni" className="border-t border-border bg-cream/50 py-20">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                Testimoni
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Dibuat untuk orang tua Indonesia
              </h2>
              <p className="mt-3 text-sm text-navy-muted">
                Ilustrasi skenario penggunaan fitur — bukan klaim metrik.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure
                  key={t.name}
                  className="flex flex-col rounded-2xl border bg-background p-6 shadow-sm"
                >
                  <Quote className="h-7 w-7 text-gold-300" />
                  <div className="mt-3 flex gap-0.5 text-gold-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-navy">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-gold-100 font-display font-bold text-gold-700">
                      {t.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy">{t.name}</p>
                      <p className="text-xs text-navy-muted">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <Pricing />

        {/* CTA */}
        <section className="py-20">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-16 text-center shadow-xl">
              <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gold-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-sage/20 blur-3xl" />
              <Flame className="mx-auto h-10 w-10 text-gold-400" />
              <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-cream sm:text-4xl">
                Jangan lewatkan momen emas tumbuh kembang si Kecil
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-cream/70">
                Mulai pantau milestone, pertumbuhan, dan rutinitas si Kecil hari ini —
                dipandu bukti ilmiah & Pendamping AI. Gratis untuk memulai.
              </p>
              <Button size="lg" className="mt-8" asChild>
                <Link href="/register">
                  Mulai Gratis Hari Ini <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

// Jadwal contoh untuk ilustrasi kalender (mencerminkan fitur pengingat & task).
const heroSchedule = [
  { icon: Syringe, color: "text-soft-orange", bg: "bg-soft-orange-soft", label: "Imunisasi DPT-HB-Hib", date: "22 Jun" },
  { icon: Stethoscope, color: "text-sage", bg: "bg-sage-soft", label: "Posyandu bulanan", date: "25 Jun" },
  { icon: Target, color: "text-gold-700", bg: "bg-gold-100", label: "Cek milestone 9 bln", date: "28 Jun" },
];

// Ringkasan per domain untuk ilustrasi laporan perkembangan.
const heroReport = [
  { label: "Motorik Kasar", pct: 90 },
  { label: "Bahasa & Komunikasi", pct: 70 },
  { label: "Sosial-Emosional", pct: 100 },
];

function HeroPreview() {
  // Tinggi batang grafik berat badan (ilustrasi tren naik mengikuti kurva WHO).
  const growthBars = [38, 50, 46, 60, 68, 64, 78, 86];

  return (
    <div className="relative mx-auto max-w-md space-y-4">
      {/* Kartu utama: profil anak + grafik pertumbuhan + milestone */}
      <div className="rounded-3xl border bg-card p-5 shadow-xl">
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
                className="flex-1 rounded-t bg-gold-400/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        {/* Ringkasan milestone & goal */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-navy/[0.04] p-3">
            <HeartPulse className="h-4 w-4 text-sage" />
            <p className="mt-1.5 font-display text-xl font-extrabold text-navy">
              8/12
            </p>
            <p className="text-[11px] text-navy-muted">Milestone tercapai</p>
          </div>
          <div className="rounded-2xl bg-navy/[0.04] p-3">
            <Target className="h-4 w-4 text-gold-600" />
            <p className="mt-1.5 font-display text-xl font-extrabold text-navy">
              60%
            </p>
            <p className="text-[11px] text-navy-muted">Goal finger food</p>
          </div>
        </div>

        <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-sage">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Status gizi akurat z-score WHO — deteksi dini stunting
        </p>
      </div>

      {/* Kartu kalender + jadwal */}
      <div className="rounded-3xl border bg-card p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-display text-sm font-bold text-navy">
            <CalendarHeart className="h-4 w-4 text-gold-600" /> Juni 2026
          </p>
          <span className="text-[11px] font-semibold text-navy-muted">
            3 jadwal
          </span>
        </div>

        {/* Mini grid kalender */}
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

        {/* Daftar jadwal */}
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {heroSchedule.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${s.bg} ${s.color}`}
              >
                <s.icon className="h-3.5 w-3.5" />
              </span>
              <p className="flex-1 truncate text-xs font-medium text-navy">
                {s.label}
              </p>
              <span className="text-[11px] font-semibold text-navy-muted">
                {s.date}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-sage">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Pengingat otomatis — jadwal imunisasi & posyandu tak terlewat
        </p>
      </div>

      {/* Kartu laporan perkembangan */}
      <div className="rounded-3xl border bg-card p-5 shadow-xl">
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

        {/* Bar progres per domain */}
        <div className="mt-4 space-y-3">
          {heroReport.map((d) => (
            <div key={d.label}>
              <div className="flex items-center justify-between text-[11px] font-medium text-navy">
                <span>{d.label}</span>
                <span className="text-navy-muted">{d.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-navy/[0.07]">
                <div
                  className="h-full rounded-full bg-gold-400"
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] font-medium text-sage">
          <ShieldCheck className="h-3.5 w-3.5" /> Bagikan link read-only ke dokter — tanpa login
        </p>
      </div>

      {/* Chip Pendamping AI mengambang */}
      <div className="absolute -left-5 top-16 hidden rounded-2xl border bg-background px-3.5 py-2.5 shadow-lg sm:block">
        <p className="flex items-center gap-2 text-xs font-semibold text-navy">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-100">
            <Sparkles className="h-3.5 w-3.5 text-gold-600" />
          </span>
          Pendamping AI siap menjawab
        </p>
      </div>
    </div>
  );
}
