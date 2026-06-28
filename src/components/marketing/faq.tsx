"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Apakah ini menggantikan dokter atau Posyandu?",
    a: "Tidak. Jurnal Emas adalah alat bantu pemantauan dan edukasi berbasis pedoman WHO, IDAI, dan Denver II. Grafik, deteksi red flag, dan Pendamping AI membantu Anda lebih sigap — tetapi keputusan medis tetap perlu konsultasi ke dokter anak, bidan, atau Posyandu. Justru laporan kami dibuat agar mudah dibawa ke nakes.",
  },
  {
    q: "Apa beda paket Gratis dan Premium?",
    a: "Paket Gratis sudah lengkap untuk satu anak: milestone, grafik pertumbuhan z-score WHO, task, rutinitas, jurnal (tanpa foto), dan 3 pertanyaan AI per hari. Premium membuka profil anak tak terbatas, foto di jurnal & milestone, kuota AI penuh, serta export PDF dan berbagi laporan via link.",
  },
  {
    q: "Apakah pembayaran Premium berlangganan otomatis?",
    a: "Tidak ada auto-renew. Premium bersifat sekali bayar (bulanan atau tahunan). Akses aktif sampai tanggal berakhir, lalu otomatis kembali ke Gratis kecuali Anda memperpanjang sendiri. Tanpa jebakan langganan.",
  },
  {
    q: "Seberapa aman data anak saya?",
    a: "Data terenkripsi saat transit (TLS) dan saat disimpan. Foto disimpan di CDN aman, dan data pembayaran ditangani penuh oleh Midtrans — kami tidak menyimpan data kartu. Anda bisa menghapus akun kapan saja dan seluruh data anak ikut terhapus permanen.",
  },
  {
    q: "Bagaimana cara berbagi laporan ke dokter?",
    a: "Cukup buat tautan laporan read-only. Dokter membukanya tanpa perlu login atau install apa pun, dan tautan punya masa berlaku. Bisa juga diekspor menjadi PDF untuk dicetak.",
  },
  {
    q: "Apakah bisa untuk lebih dari satu anak?",
    a: "Bisa. Pantau beberapa anak dalam satu akun di paket Premium, lengkap dengan pengingat imunisasi & posyandu untuk masing-masing anak.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto mt-12 max-w-3xl space-y-3">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={f.q}
            className={cn(
              "overflow-hidden rounded-2xl border bg-card transition-colors",
              isOpen ? "border-gold-300 shadow-sm" : "border-border",
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-sm font-bold text-navy sm:text-base">
                {f.q}
              </span>
              <Plus
                className={cn(
                  "h-5 w-5 shrink-0 text-gold-600 transition-transform duration-300",
                  isOpen && "rotate-45",
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-navy-muted">
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
