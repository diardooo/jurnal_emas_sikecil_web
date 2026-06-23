import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const points = [
  "Pantau milestone 0–6 tahun berbasis WHO & IDAI",
  "Reminder imunisasi & posyandu otomatis",
  "Task, To-Do, Habit, dan Goal dalam satu tempat",
  "Laporan perkembangan siap dibawa ke dokter",
];

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-cream lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-sage/20 blur-3xl" />
        <Logo href="/" className="[&_span]:text-cream" />
        <div className="relative max-w-md">
          <h2 className="font-display text-3xl font-extrabold leading-tight">
            Setiap hari adalah momen emas untuk si Kecil.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-cream/80">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                <span className="text-sm leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-cream/50">
          © {new Date().getFullYear()} Jurnal Emas Si Kecil
        </p>
      </div>

      {/* Form side */}
      <div className="flex flex-col bg-cream/40">
        <div className="p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-navy-muted hover:text-navy lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <Logo href="/" />
            </div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-navy-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
