import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const cols = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "#fitur" },
      { label: "Cara Kerja", href: "#cara-kerja" },
      { label: "Harga", href: "#harga" },
    ],
  },
  {
    title: "Mulai",
    links: [
      { label: "Coba Gratis", href: "/register" },
      { label: "Masuk", href: "/login" },
      { label: "Lihat Demo", href: "/demo" },
    ],
  },
  {
    title: "Legal & Bantuan",
    links: [
      { label: "Kebijakan Privasi", href: "/privacy" },
      { label: "Syarat & Ketentuan", href: "/terms" },
      { label: "Kontak", href: "mailto:halo@jurnalemas.com" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-navy text-cream/80">
      <div className="container grid grid-cols-1 gap-10 py-14 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-cream/70">
            Pendamping digital tepercaya untuk merayakan dan mengoptimalkan
            setiap momen emas tumbuh kembang si Kecil.
          </p>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h4 className="font-display text-sm font-bold text-cream">
              {col.title}
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-cream/70 transition-colors hover:text-gold-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-cream/10">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Jurnal Emas Si Kecil. Hak cipta dilindungi.</p>
          <p>Dibuat dengan ❤️ untuk orang tua Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}
