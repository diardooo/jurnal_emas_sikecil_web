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

export const metadata: Metadata = {
  title: "Jurnal Emas Si Kecil — Pendamping Tumbuh Kembang Anak",
  description:
    "Platform all-in-one untuk memantau, mencatat, dan mengoptimalkan tumbuh kembang anak 0–6 tahun. Task Manager, To-Do, Habit Tracker, dan Goal Tracker dalam satu ekosistem parenting.",
  keywords: [
    "parenting",
    "tumbuh kembang anak",
    "milestone anak",
    "habit tracker",
    "jurnal anak",
  ],
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
