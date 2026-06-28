import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Baloo_2 } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Prefer an explicit NEXT_PUBLIC_APP_URL; otherwise fall back to the known
// production domain so link previews resolve even if the env var is unset.
const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://jurnal-emas-sikecil-web.vercel.app";

const title = "Jurnal Emas Si Kecil — Pendamping Tumbuh Kembang Anak";
const description =
  "Platform all-in-one untuk memantau, mencatat, dan mengoptimalkan tumbuh kembang anak 0–6 tahun. Task Manager, To-Do, Habit Tracker, dan Goal Tracker dalam satu ekosistem parenting.";

export const metadata: Metadata = {
  // Makes og:image / twitter:image URLs absolute — required by WhatsApp,
  // Facebook, etc. to render link previews.
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    "parenting",
    "tumbuh kembang anak",
    "milestone anak",
    "habit tracker",
    "jurnal anak",
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Jurnal Emas Si Kecil",
    title,
    description,
    url: siteUrl,
    // The image itself is produced by app/opengraph-image.tsx; Next.js wires it
    // into og:image automatically with the correct absolute URL & dimensions.
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#C9A227",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
