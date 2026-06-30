import type { MetadataRoute } from "next";

/** PWA manifest — makes the app installable (required for iOS Web Push) and
 *  gives Android a proper home-screen icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jurnal Emas Si Kecil",
    short_name: "Jurnal Emas",
    description:
      "Pendamping tumbuh kembang anak 0–6 tahun — catatan, milestone, dan pengingat dalam satu aplikasi.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#FBF7ED",
    theme_color: "#C9A227",
    lang: "id",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
