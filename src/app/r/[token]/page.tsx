"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { getAge, formatDateID } from "@/lib/utils";

type Report = {
  child: { name: string; dob: string; gender: string };
  range: { from: string | null; to: string | null };
  expiresAt: string | null;
  growth: { date: string | null; ageMonths: number; weight: number | null; height: number | null; headCirc: number | null }[];
  milestones: { achieved: { title: string; domain: string }[]; total: number };
  immunizations: { done: number; total: number };
};

export default function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch(`/api/public/report/${token}`);
        const body = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok) setError(body.error ?? "Laporan tidak tersedia");
        else setData(body as Report);
      } catch {
        if (active) setError("Gagal memuat laporan");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream p-6 text-center">
        <div>
          <p className="font-display text-xl font-bold text-navy">Laporan tidak tersedia</p>
          <p className="mt-2 text-sm text-navy-muted">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-gold-700 hover:underline">
            ← Jurnal Emas Si Kecil
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream">
        <p className="text-sm text-navy-muted">Memuat laporan…</p>
      </main>
    );
  }

  const age = getAge(data.child.dob);
  const latest = data.growth[data.growth.length - 1];

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-cream px-5 py-10">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-700">
              Laporan Perkembangan Anak
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-navy">{data.child.name}</h1>
            <p className="mt-1 text-sm text-navy-muted">
              {data.child.gender === "L" ? "Laki-laki" : "Perempuan"} • {age.label} • Lahir{" "}
              {formatDateID(data.child.dob)}
            </p>
          </div>
          <span className="shrink-0 font-display text-sm font-bold text-gold-700">Jurnal Emas</span>
        </div>

        {/* Summary cards */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Milestone tercapai" value={`${data.milestones.achieved.length}/${data.milestones.total}`} />
          <Stat label="Imunisasi" value={`${data.immunizations.done}/${data.immunizations.total}`} />
          <Stat
            label="Pengukuran"
            value={`${data.growth.length}×`}
          />
        </div>

        {/* Growth */}
        <Section title="Riwayat Pertumbuhan">
          {data.growth.length === 0 ? (
            <Empty>Belum ada data pertumbuhan.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-navy-muted">
                    <th className="py-2 pr-3">Usia</th>
                    <th className="py-2 pr-3">Tanggal</th>
                    <th className="py-2 pr-3">BB (kg)</th>
                    <th className="py-2 pr-3">TB (cm)</th>
                    <th className="py-2">LK (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.growth.map((g, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-3">{g.ageMonths} bln</td>
                      <td className="py-2 pr-3 text-navy-muted">{g.date ? formatDateID(g.date) : "—"}</td>
                      <td className="py-2 pr-3">{g.weight ?? "—"}</td>
                      <td className="py-2 pr-3">{g.height ?? "—"}</td>
                      <td className="py-2">{g.headCirc ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {latest && (
                <p className="mt-3 text-xs text-navy-muted">
                  Terkini ({latest.ageMonths} bln): BB {latest.weight ?? "—"} kg • TB {latest.height ?? "—"} cm
                </p>
              )}
            </div>
          )}
        </Section>

        {/* Milestones */}
        <Section title={`Milestone Tercapai (${data.milestones.achieved.length})`}>
          {data.milestones.achieved.length === 0 ? (
            <Empty>Belum ada milestone yang ditandai tercapai.</Empty>
          ) : (
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {data.milestones.achieved.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-navy">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                  {m.title}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Footer */}
        <div className="mt-8 border-t pt-4 text-center text-xs text-navy-muted">
          Laporan read-only dibagikan dari <span className="font-semibold text-navy">Jurnal Emas Si Kecil</span>.
          {data.expiresAt && ` Berlaku sampai ${formatDateID(data.expiresAt)}.`}
          <div className="mt-1">
            Bukan diagnosis medis — untuk evaluasi, konsultasikan ke dokter anak/bidan/Posyandu.
          </div>
          <Link href="/" className="mt-2 inline-block font-semibold text-gold-700 hover:underline">
            Pantau tumbuh kembang anak Anda juga →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3 text-center">
      <p className="font-display text-lg font-extrabold text-navy">{value}</p>
      <p className="mt-0.5 text-[11px] text-navy-muted">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-display text-sm font-bold text-navy">{title}</h2>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-navy-muted">{children}</p>;
}
