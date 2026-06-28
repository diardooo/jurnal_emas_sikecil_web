import { ogSize, renderOgCard } from "@/lib/og-card";

// Twitter/X reuses the same branded card as Open Graph.
export const runtime = "edge";
export const alt = "Jurnal Emas Si Kecil — Pendamping Tumbuh Kembang Anak";
export const size = ogSize;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderOgCard();
}
