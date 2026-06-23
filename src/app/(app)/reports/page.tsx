"use client";

import { useState } from "react";
import { Download, FileText, Link2, Lock, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { WhoGrowthChart } from "@/components/app/who-growth-chart";
import { useAppStore } from "@/store/app-store";
import { domainMeta } from "@/lib/domains";
import { milestoneDomains } from "@/lib/mock-data";
import { formatDateID, getAge, initials } from "@/lib/utils";

export default function ReportsPage() {
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const milestonesMap = useAppStore((s) => s.milestones);
  const plan = useAppStore((s) => s.plan);

  const growthMap = useAppStore((s) => s.growth);
  const child = children.find((c) => c.id === activeId) ?? children[0];
  const age = getAge(child.dob);
  const milestones = milestonesMap[activeId] ?? [];
  const growth = growthMap[child.id] ?? [];
  const latest = growth[growth.length - 1];
  const first = growth[0];
  const achievedList = milestones.filter((m) => m.status === "bisa");

  // milestone breakdown per development domain
  const byDomain = milestoneDomains.map((d) => {
    const items = milestones.filter((m) => m.domain === d);
    const done = items.filter((m) => m.status === "bisa").length;
    return {
      domain: d,
      done,
      total: items.length,
      pct: items.length ? Math.round((done / items.length) * 100) : 0,
    };
  });

  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-06-19");

  const isPremium = plan === "premium";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Perkembangan"
        description="Buat laporan untuk dibawa ke dokter atau tenaga kesehatan."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Builder */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaturan Laporan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="from">Dari Tanggal</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to">Sampai Tanggal</Label>
                <Input
                  id="to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              {isPremium ? (
                <div className="space-y-2 pt-2">
                  <Button
                    className="w-full"
                    onClick={() =>
                      toast.success("Laporan PDF dibuat (demo)", {
                        description: "File siap diunduh.",
                      })
                    }
                  >
                    <Download /> Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      toast.success("Tautan laporan disalin");
                    }}
                  >
                    <Link2 /> Bagikan via Link
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => window.print()}
                  >
                    <Printer /> Cetak
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 text-center">
                  <Lock className="mx-auto h-6 w-6 text-gold-600" />
                  <p className="mt-2 text-sm font-semibold text-navy">
                    Export PDF fitur Premium
                  </p>
                  <p className="mt-1 text-xs text-navy-muted">
                    Upgrade untuk mengunduh & membagikan laporan.
                  </p>
                  <Button size="sm" className="mt-3 w-full" asChild>
                    <a href="/settings">Upgrade ke Emas</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <Card className="overflow-hidden">
          <div className="border-b bg-secondary/40 px-6 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-muted">
              <FileText className="h-4 w-4" /> Pratinjau Laporan
            </p>
          </div>
          <CardContent className="p-8">
            {/* Document header */}
            <div className="flex items-start justify-between border-b-2 border-gold-400 pb-5">
              <div>
                <p className="font-display text-xl font-extrabold text-navy">
                  Laporan Perkembangan Anak
                </p>
                <p className="text-sm text-navy-muted">
                  Periode {formatDateID(from)} – {formatDateID(to)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-bold text-gold-600">
                  Jurnal Emas Si Kecil
                </p>
                <p className="text-xs text-navy-muted">
                  Dibuat {formatDateID(new Date())}
                </p>
              </div>
            </div>

            {/* Child info */}
            <div className="mt-6 flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-gold-300">
                <AvatarImage src={child.photoUrl} alt={child.name} />
                <AvatarFallback>{initials(child.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                <Field label="Nama" value={child.name} />
                <Field
                  label="Jenis Kelamin"
                  value={child.gender === "L" ? "Laki-laki" : "Perempuan"}
                />
                <Field label="Usia" value={age.label} />
                <Field label="Tanggal Lahir" value={formatDateID(child.dob)} />
                {latest && (
                  <>
                    <Field label="Berat" value={`${latest.weight} kg`} />
                    <Field label="Tinggi" value={`${latest.height} cm`} />
                  </>
                )}
              </div>
            </div>

            {/* Growth summary */}
            {first && latest && (
              <Section title="Ringkasan Pertumbuhan">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Berat lahir" value={`${first.weight} kg`} />
                  <Metric label="Berat kini" value={`${latest.weight} kg`} />
                  <Metric label="Tinggi lahir" value={`${first.height} cm`} />
                  <Metric label="Tinggi kini" value={`${latest.height} cm`} />
                </div>
                <a
                  href="/growth"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-700 hover:underline"
                >
                  Catat / lihat detail tumbuh kembang →
                </a>
              </Section>
            )}

            {/* Growth chart */}
            {growth.length > 1 && (
              <Section title="Grafik Pertumbuhan (vs Kurva WHO)">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border bg-background p-3">
                    <p className="mb-1 text-xs font-semibold text-navy-muted">
                      Berat Badan
                    </p>
                    <WhoGrowthChart data={growth} metric="weight" />
                  </div>
                  <div className="rounded-xl border bg-background p-3">
                    <p className="mb-1 text-xs font-semibold text-navy-muted">
                      Tinggi Badan
                    </p>
                    <WhoGrowthChart data={growth} metric="height" />
                  </div>
                </div>
              </Section>
            )}

            {/* Per-category development */}
            <Section title="Perkembangan per Kategori">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {byDomain.map((d) => {
                  const meta = domainMeta[d.domain];
                  return (
                    <div
                      key={d.domain}
                      className="rounded-xl border bg-background p-4"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid h-8 w-8 place-items-center rounded-lg ${meta.color}`}
                        >
                          <meta.icon className="h-4 w-4" />
                        </span>
                        <p className="flex-1 text-sm font-semibold text-navy">
                          {d.domain}
                        </p>
                        <span className="text-sm font-bold text-gold-700">
                          {d.done}/{d.total}
                        </span>
                      </div>
                      <Progress value={d.pct} className="mt-3" />
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Milestones */}
            <Section title={`Milestone Tercapai (${achievedList.length})`}>
              <ul className="space-y-2">
                {achievedList.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-navy">{m.title}</span>
                      <span className="ml-2 text-xs text-navy-muted">
                        {m.domain}
                      </span>
                    </div>
                    {m.achievedAt && (
                      <Badge variant="success">
                        {formatDateID(m.achievedAt)}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Catatan Penting">
              <p className="rounded-lg bg-secondary/50 p-4 text-sm italic text-navy-muted">
                Perkembangan {child.name} berjalan sesuai dengan rentang usia.
                Lanjutkan stimulasi rutin dan pemantauan berkala. Laporan ini
                merupakan rekam jejak mandiri dan bukan pengganti diagnosis medis.
              </p>
            </Section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-navy-muted">{label}</p>
      <p className="font-semibold text-navy">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <h4 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-gold-700">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3 text-center">
      <p className="font-display text-lg font-bold text-navy">{value}</p>
      <p className="text-xs text-navy-muted">{label}</p>
    </div>
  );
}
