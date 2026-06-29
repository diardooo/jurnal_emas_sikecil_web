import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-cream/40 px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <Logo />
        <p className="mt-8 font-display text-6xl font-extrabold text-gold-500">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-extrabold text-navy">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-2 text-sm text-navy-muted">
          Tautan mungkin salah atau halaman sudah dipindahkan. Yuk kembali ke
          beranda.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild>
            <Link href="/dashboard">Ke Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Halaman Utama</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
