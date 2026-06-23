import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel — Jurnal Emas Si Kecil",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {children}
    </div>
  );
}
