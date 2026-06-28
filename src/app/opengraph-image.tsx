import { ogSize, renderOgCard } from "@/lib/og-card";

// Next.js wires this into <meta property="og:image"> automatically.
export const runtime = "edge";
export const alt = "Jurnal Emas Si Kecil — Pendamping Tumbuh Kembang Anak";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgCard();
}
