import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Baby,
  BadgeCheck,
  CalendarHeart,
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flame,
  HeartPulse,
  LineChart,
  Quote,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  X,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Pricing } from "@/components/marketing/pricing";
import { Aurora } from "@/components/marketing/aurora";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { Faq } from "@/components/marketing/faq";
import {
  CountUp,
  Magnetic,
  Reveal,
  ScrollProgress,
  SpotlightCard,
} from "@/components/marketing/fx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SITE_URL = "https://jurnal-emas-sikecil-web.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Jurnal Emas Si Kecil — Pantau Tumbuh Kembang Anak dengan AI",
  description:
    "Pantau milestone, pertumbuhan z-score WHO, imunisasi, dan rutinitas si Kecil — dipandu Pendamping AI berbasis data anak Anda. Berbasis bukti WHO, IDAI & Denver II. Gratis untuk memulai.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: "Jurnal Emas Si Kecil",
    title: "Jurnal Emas Si Kecil — Pantau Tumbuh Kembang Anak dengan AI",
    description:
      "Milestone, grafik pertumbuhan z-score WHO, pengingat imunisasi, dan Pendamping AI berbasis data anak Anda — dalam satu aplikasi. Gratis untuk memulai.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jurnal Emas Si Kecil — Pantau Tumbuh Kembang Anak dengan AI",
    description:
      "Milestone, pertumbuhan z-score WHO, pengingat imunisasi & Pendamping AI berbasis data anak Anda. Gratis untuk memulai.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Jurnal Emas Si Kecil",
  applicationCategory: "HealthApplication",
  operatingSystem: "Web",
  description:
    "Aplikasi pemantauan tumbuh kembang anak 0–6 tahun: milestone, grafik pertumbuhan z-score WHO, imunisasi, rutinitas, dan Pendamping AI berbasis data anak.",
  url: SITE_URL,
  inLanguage: "id-ID",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "IDR", name: "Gratis" },
    { "@type": "Offer", price: "49000", priceCurrency: "IDR", name: "Premium Bulanan" },
    { "@type": "Offer", price: "399000", priceCurrency: "IDR", name: "Premium Tahunan" },
  ],
};

const credibility = [
  "WHO Child Growth Standards",
  "IDAI",
  "KPSP",
  "Denver II",
  "Kurva Pertumbuhan z-score",
  "Jadwal Imunisasi IDAI",
];

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

const comparison = [
  "Grafik z-score WHO otomatis",
  "Deteksi red flag keterlambatan",
  "Pengingat imunisasi & posyandu",
  "Pendamping AI dari data anak",
  "Laporan siap dibagikan ke dokter",
  "Beberapa anak dalam satu tempat",
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

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgress />
      <SiteHeader />

      <main className="flex-1">
        {/* ============================================ HERO */}
        <section className="relative overflow-hidden bg-cream/40">
          <Aurora />
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-50" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-300/60 to-transparent" />

          <div className="container relative grid grid-cols-1 items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <Reveal>
                <Badge variant="gold" className="mb-5 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Pendamping tumbuh kembang ber-AI & berbasis bukti ilmiah
                </Badge>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-navy text-balance sm:text-5xl lg:text-6xl">
                  Rayakan setiap{" "}
                  <span className="text-gradient-gold animate-gradient-x">
                    momen emas
                  </span>{" "}
                  tumbuh kembang si Kecil
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy-muted">
                  Pantau milestone, pertumbuhan z-score WHO, dan rutinitas — plus{" "}
                  <span className="font-semibold text-navy">Pendamping AI</span>{" "}
                  yang menjawab dari data anak Anda sendiri. Berbasis bukti WHO,
                  IDAI & Denver.
                </p>
              </Reveal>
              <Reveal delay={240}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Magnetic className="w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full shadow-lg shadow-gold-500/20 sm:w-auto"
                      asChild
                    >
                      <Link href="/register">
                        Mulai Gratis Sekarang
                        <ArrowRight />
                      </Link>
                    </Button>
                  </Magnetic>
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                    asChild
                  >
                    <Link href="/demo">Lihat Demo Dashboard</Link>
                  </Button>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-navy-muted">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sage" /> Gratis untuk
                    memulai
                  </span>
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-sage" /> Tanpa kartu
                    kredit
                  </span>
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-sage" /> Data anak
                    terenkripsi
                  </span>
                </div>
              </Reveal>
            </div>

            {/* Hero visual */}
            <Reveal delay={200} className="relative">
              <HeroPreview />
            </Reveal>
          </div>

          {/* Scroll hint */}
          <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden justify-center lg:flex">
            <span className="flex items-center gap-2 text-xs font-medium text-navy-muted">
              <ArrowDown className="h-4 w-4 motion-safe:animate-bounce" /> Gulir
              untuk menjelajah
            </span>
          </div>
        </section>

        {/* ============================================ CREDIBILITY MARQUEE */}
        <section className="border-y border-border bg-background py-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-navy-muted">
            Berlandaskan pedoman ilmiah tepercaya
          </p>
          <div className="mask-fade-x overflow-hidden">
            <div className="flex w-max motion-safe:animate-marquee">
              {[...credibility, ...credibility].map((c, i) => (
                <span
                  key={i}
                  className="mx-4 flex items-center gap-2 whitespace-nowrap font-display text-sm font-bold text-navy/70"
                >
                  <BadgeCheck className="h-4 w-4 text-gold-600" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ STATS */}
        <section className="relative overflow-hidden border-b border-border bg-navy">
          <Aurora variant="dark" />
          <div className="container relative grid grid-cols-2 gap-6 py-12 md:grid-cols-4">
            {[
              { node: <CountUp to={7} />, label: "Domain perkembangan" },
              { node: <CountUp to={3} />, label: "Standar ilmiah (WHO·IDAI·Denver)" },
              { node: <>0–6 thn</>, label: "Rentang usia dipantau" },
              { node: <>AI 24/7</>, label: "Pendamping berbasis data anak" },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 80} className="text-center">
                <p className="font-display text-3xl font-extrabold text-gold-400 sm:text-4xl">
                  {s.node}
                </p>
                <p className="mt-1 text-sm text-cream/70">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============================================ FEATURES */}
        <section id="fitur" className="py-20 lg:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
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
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m, i) => (
                <Reveal key={m.title} delay={(i % 3) * 90}>
                  <SpotlightCard className="h-full p-6">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${m.color}`}
                    >
                      <m.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold text-navy">
                      {m.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-navy-muted">
                      {m.desc}
                    </p>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ DEMO SHOWCASE */}
        <section className="relative overflow-hidden border-y border-border bg-cream/40 py-20 lg:py-28">
          <Aurora />
          <div className="container relative">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                Coba Langsung
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Lihat dashboard-nya, tanpa perlu daftar
              </h2>
              <p className="mt-3 text-navy-muted">
                Masuk ke mode demo read-only dengan data contoh — rasakan
                alurnya dalam hitungan detik.
              </p>
            </Reveal>

            <Reveal delay={120} className="mt-12">
              {/* Browser frame */}
              <div className="relative mx-auto max-w-4xl rounded-2xl border border-navy/10 bg-navy p-2 shadow-2xl">
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="h-3 w-3 rounded-full bg-alert-red/80" />
                  <span className="h-3 w-3 rounded-full bg-soft-orange/80" />
                  <span className="h-3 w-3 rounded-full bg-sage/80" />
                  <span className="ml-3 hidden flex-1 rounded-md bg-white/10 px-3 py-1 text-xs text-cream/60 sm:block">
                    jurnalemas.app/dashboard
                  </span>
                </div>
                <div className="rounded-xl bg-background p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-navy-muted">Selamat pagi 👋</p>
                      <p className="font-display text-lg font-extrabold text-navy">
                        Dashboard Bintang
                      </p>
                    </div>
                    <Badge variant="success" className="gap-1">
                      <Flame className="h-3 w-3" /> Streak 12 hari
                    </Badge>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { icon: LineChart, label: "Pertumbuhan", value: "z +0,4", tint: "bg-gold-50 text-gold-700" },
                      { icon: Target, label: "Milestone", value: "8/12", tint: "bg-navy/[0.05] text-navy" },
                      { icon: Repeat, label: "Rutinitas", value: "5/6", tint: "bg-sage-soft text-sage" },
                      { icon: HeartPulse, label: "Jurnal", value: "24 momen", tint: "bg-soft-orange-soft text-soft-orange" },
                    ].map((t) => (
                      <div key={t.label} className="rounded-xl border bg-card p-3">
                        <span className={`grid h-8 w-8 place-items-center rounded-lg ${t.tint}`}>
                          <t.icon className="h-4 w-4" />
                        </span>
                        <p className="mt-2 font-display text-lg font-extrabold text-navy">
                          {t.value}
                        </p>
                        <p className="text-[11px] text-navy-muted">{t.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl border border-soft-orange/30 bg-soft-orange-soft p-3">
                    <p className="flex items-center gap-2 text-xs font-semibold text-soft-orange">
                      <CalendarHeart className="h-4 w-4" /> Imunisasi DPT-HB-Hib
                      dalam 2 hari
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200} className="mt-10 text-center">
              <Magnetic>
                <Button size="lg" asChild>
                  <Link href="/demo">
                    Buka Demo Interaktif <ArrowRight />
                  </Link>
                </Button>
              </Magnetic>
            </Reveal>
          </div>
        </section>

        {/* ============================================ DOMAINS */}
        <section className="border-b border-border bg-secondary/40 py-16">
          <div className="container text-center">
            <Reveal>
              <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">
                Milestone di 7 domain perkembangan
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-navy-muted">
                Ditinjau berdasarkan standar WHO Child Growth, Denver
                Developmental Screening II, dan KPSP IDAI.
              </p>
            </Reveal>
            <Reveal delay={120} className="mt-7 flex flex-wrap justify-center gap-3">
              {domains.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-gold-200 bg-background px-4 py-2 text-sm font-semibold text-navy transition-colors hover:border-gold-400 hover:bg-gold-50"
                >
                  {d}
                </span>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ============================================ HOW IT WORKS */}
        <section id="cara-kerja" className="py-20 lg:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                Cara Kerja
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Mulai dalam 3 langkah mudah
              </h2>
            </Reveal>
            <div className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
              {/* Connecting line (desktop) */}
              <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold-300 to-transparent md:block" />
              {steps.map((s, i) => (
                <Reveal key={s.title} delay={i * 120} className="relative text-center">
                  <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gold-100 text-gold-700 shadow-sm ring-8 ring-background">
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
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ COMPARISON */}
        <section className="border-y border-border bg-cream/40 py-20 lg:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                Kenapa Jurnal Emas
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Lebih dari sekadar buku catatan
              </h2>
              <p className="mt-3 text-navy-muted">
                Yang biasanya tersebar di buku KIA, catatan HP, dan ingatan —
                kini otomatis, terpadu, dan berbasis bukti.
              </p>
            </Reveal>

            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
              <Reveal>
                <div className="h-full rounded-3xl border border-border bg-background/60 p-7">
                  <p className="font-display text-lg font-bold text-navy-muted">
                    Cara manual
                  </p>
                  <p className="mt-1 text-sm text-navy-muted">
                    Buku KIA + catatan terpisah
                  </p>
                  <ul className="mt-6 space-y-3">
                    {comparison.map((c) => (
                      <li
                        key={c}
                        className="flex items-center gap-3 text-sm text-navy-muted"
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-alert-red-soft text-alert-red">
                          <X className="h-3 w-3" />
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
              <Reveal delay={120}>
                <div className="relative h-full overflow-hidden rounded-3xl border-2 border-gold-400 bg-gradient-to-b from-gold-50 to-background p-7 shadow-lg">
                  <div className="absolute right-5 top-5">
                    <Badge variant="gold" className="gap-1">
                      <Sparkles className="h-3 w-3" /> Jurnal Emas
                    </Badge>
                  </div>
                  <p className="font-display text-lg font-bold text-navy">
                    Dengan Jurnal Emas
                  </p>
                  <p className="mt-1 text-sm text-navy-muted">
                    Satu app, otomatis & berbasis bukti
                  </p>
                  <ul className="mt-6 space-y-3">
                    {comparison.map((c) => (
                      <li
                        key={c}
                        className="flex items-center gap-3 text-sm font-medium text-navy"
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage text-white">
                          <Check className="h-3 w-3" />
                        </span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============================================ TESTIMONIALS */}
        <section id="testimoni" className="py-20 lg:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                Testimoni
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Dibuat untuk orang tua Indonesia
              </h2>
              <p className="mt-3 text-sm text-navy-muted">
                Ilustrasi skenario penggunaan fitur — bukan klaim metrik.
              </p>
            </Reveal>
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {testimonials.map((t, i) => (
                <Reveal key={t.name} delay={i * 100}>
                  <figure className="flex h-full flex-col rounded-2xl border bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    <Quote className="h-7 w-7 text-gold-300" />
                    <div className="mt-3 flex gap-0.5 text-gold-500">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" />
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
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================ PRICING */}
        <Pricing />

        {/* ============================================ FAQ */}
        <section className="border-t border-border bg-cream/40 py-20 lg:py-28">
          <div className="container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <Badge variant="gold" className="mb-4">
                FAQ
              </Badge>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
                Pertanyaan yang sering ditanya
              </h2>
            </Reveal>
            <Faq />
          </div>
        </section>

        {/* ============================================ CTA */}
        <section className="py-20 lg:py-28">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-16 text-center shadow-xl">
              <Aurora variant="dark" />
              <div className="relative">
                <Flame className="mx-auto h-10 w-10 text-gold-400" />
                <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-cream sm:text-4xl">
                  Jangan lewatkan momen emas tumbuh kembang si Kecil
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-cream/70">
                  Mulai pantau milestone, pertumbuhan, dan rutinitas si Kecil
                  hari ini — dipandu bukti ilmiah & Pendamping AI. Gratis untuk
                  memulai.
                </p>
                <Magnetic className="mt-8">
                  <Button size="lg" className="shadow-lg shadow-gold-500/30" asChild>
                    <Link href="/register">
                      Mulai Gratis Hari Ini <ArrowRight />
                    </Link>
                  </Button>
                </Magnetic>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
