import { ogSize, renderOgCard } from "@/lib/og-card";

// Next.js wires this into <meta property="og:image"> automatically.
// Node runtime (default) so the logo asset can be read from the filesystem.
export const alt = "Jurnal Emas Si Kecil — Pendamping Tumbuh Kembang Anak";
export const size = ogSize;
export const contentType = "image/png";

export default function OpengraphImage() {
  return renderOgCard();
}
