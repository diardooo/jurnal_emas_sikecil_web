import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Baby,
  CalendarHeart,
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
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Pricing } from "@/components/marketing/pricing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const modules = [
  {
    icon: LineChart,
    title: "Tumbuh Kembang",
    desc: "Grafik berat, tinggi & lingkar kepala dibandingkan kurva WHO, plus imunisasi (IDAI), gigi, dan pola tidur.",
    color: "bg-gold-100 text-gold-700",
  },
  {
    icon: Target,
    title: "Goal & Milestone",
    desc: "Milestone 0–6 tahun dikelompokkan per fase usia & domain — mengacu WHO, IDAI (KPSP) & Denver II.",
    color: "bg-navy/10 text-navy",
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
    desc: "Rekap per kategori perkembangan & grafik pertumbuhan — siap diunduh PDF untuk dibawa ke dokter.",
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

const testimonials = [
  {
    name: "Rara",
    role: "Ibu baru, anak 8 bulan",
    quote:
      "Akhirnya tenang karena tahu milestone bayi saya normal. Reminder imunisasinya benar-benar penyelamat!",
  },
  {
    name: "Budi & Sari",
    role: "Orang tua pekerja",
    quote:
      "Cepat diisi sambil kerja. Kami berdua bisa lihat progress anak kapan saja dari satu akun.",
  },
  {
    name: "Dewi",
    role: "Ibu anak prasekolah",
    quote:
      "Goal tracker-nya membantu saya menyiapkan si Kakak masuk SD dengan terstruktur.",
  },
];

const stats = [
  { value: "0–6", label: "Tahun usia anak dipantau" },
  { value: "7", label: "Domain perkembangan" },
  { value: "4", label: "Modul terintegrasi" },
  { value: "100%", label: "Bahasa Indonesia" },
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
                Pendamping tumbuh kembang #1 untuk orang tua Indonesia
              </Badge>
              <h1 className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-6xl text-balance">
                Rayakan setiap{" "}
                <span className="text-gold-600">momen emas</span> tumbuh kembang
                si Kecil
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy-muted">
                Satu platform untuk memantau milestone, mengatur rutinitas, dan
                membangun kebiasaan baik — berbasis bukti ilmiah WHO, IDAI &
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
                  <CheckCircle2 className="h-4 w-4 text-sage" /> Gratis 14 hari
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
                Dipercaya orang tua Indonesia
              </h2>
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
                Bergabung dengan ribuan orang tua yang memantau perkembangan anak
                secara konsisten dan menyenangkan.
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

function HeroPreview() {
  return (
    <div className="relative mx-auto max-w-md">
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

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-sage-soft p-4">
            <HeartPulse className="h-5 w-5 text-sage" />
            <p className="mt-2 font-display text-2xl font-extrabold text-navy">
              8/12
            </p>
            <p className="text-xs text-navy-muted">Milestone tercapai</p>
          </div>
          <div className="rounded-2xl bg-gold-50 p-4">
            <Target className="h-5 w-5 text-gold-600" />
            <p className="mt-2 font-display text-2xl font-extrabold text-navy">
              60%
            </p>
            <p className="text-xs text-navy-muted">Goal finger food</p>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-soft-orange/30 bg-soft-orange-soft p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-soft-orange">
            <CalendarHeart className="h-4 w-4" /> Imunisasi dalam 3 hari
          </p>
          <p className="mt-1 text-sm font-medium text-navy">
            DPT-HB-Hib lanjutan • 22 Jun 2026
          </p>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border bg-background px-4 py-3 shadow-lg sm:block">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy">
          <CheckCircle2 className="h-4 w-4 text-sage" /> Tummy time selesai
        </p>
      </div>
    </div>
  );
}
