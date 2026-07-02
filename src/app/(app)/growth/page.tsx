"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bed,
  Check,
  Circle,
  Info,
  RotateCcw,
  Ruler,
  Scale,
  Smile,
  Syringe,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { MeasurementDialog } from "@/components/app/measurement-dialog";
import { ImmunizationDialog } from "@/components/app/immunization-dialog";
import { SleepDialog } from "@/components/app/sleep-dialog";
import { WhoGrowthChart } from "@/components/app/who-growth-chart";
import { ToothIcon } from "@/components/app/tooth-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { sleepIdeal } from "@/lib/mock-data";
import { classifyWho, type WhoMetric } from "@/lib/who";
import { cn, formatDateID, getAge } from "@/lib/utils";
import type { Gender, GrowthRecord, ImmunizationStatus } from "@/lib/types";

/** Recommended total sleep range (hours) by age in months. */
function idealSleepRange(months: number): [number, number] {
  if (months <= 3) return [14, 17];
  if (months <= 11) return [12, 15];
  if (months <= 24) return [11, 14];
  return [10, 13];
}

const metricMeta: {
  key: WhoMetric;
  label: string;
  short: string;
  unit: string;
  icon: typeof Scale;
}[] = [
  { key: "weight", label: "Berat Badan", short: "Berat", unit: "kg", icon: Scale },
  { key: "height", label: "Tinggi Badan", short: "Tinggi", unit: "cm", icon: Ruler },
  { key: "headCirc", label: "Lingkar Kepala", short: "L. Kepala", unit: "cm", icon: Circle },
];

function valueOf(r: GrowthRecord, k: WhoMetric) {
  return k === "weight" ? r.weight : k === "height" ? r.height : r.headCirc;
}

export default function GrowthPage() {
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const growthMap = useAppStore((s) => s.growth);

  const child = children.find((c) => c.id === activeId) ?? children[0];
  const age = getAge(child.dob);
  const records = growthMap[activeId] ?? [];
  const latest = records[records.length - 1];
  // Months elapsed since the last measurement — used to flag stale data so the
  // WHO status badges aren't read as the child's current condition.
  const monthsSinceLatest = latest ? age.months - latest.ageMonths : 0;
  const staleGrowth = latest != null && monthsSinceLatest >= 2;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tumbuh Kembang"
        description={`Pantau pertumbuhan ${child.name} berdasarkan standar WHO & IDAI.`}
        action={<MeasurementDialog />}
      />

      {staleGrowth && (
        <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-soft-orange" />
          <p className="text-sm text-navy-muted">
            Pengukuran terakhir sudah <strong>{monthsSinceLatest} bulan</strong>{" "}
            lalu (saat usia {latest.ageMonths} bln). Status di bawah menilai data
            tersebut, <strong>bukan</strong> kondisi {child.name} saat ini —
            tambah pengukuran terbaru untuk hasil yang akurat.
          </p>
        </div>
      )}

      {/* Summary cards with WHO status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {metricMeta.map((m) => {
          const val = latest ? valueOf(latest, m.key) : undefined;
          // Classify against the age WHEN the measurement was taken, not the
          // child's current age — otherwise a valid past-dated entry is judged
          // against a standard for an older age and shows false stunting/etc.
          const status =
            val != null && latest
              ? classifyWho(m.key, latest.ageMonths, val, child.gender)
              : undefined;
          return (
            <Card key={m.key}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-100 text-gold-700">
                    <m.icon className="h-5 w-5" />
                  </span>
                  {status && (
                    <Badge variant={status.tone}>{status.label}</Badge>
                  )}
                </div>
                <p className="mt-4 font-display text-2xl font-extrabold text-navy">
                  {val != null ? `${val} ${m.unit}` : "—"}
                </p>
                <p className="text-xs text-navy-muted">{m.label}</p>
                {status?.percentile != null && (
                  <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                    Persentil ke-{Math.round(status.percentile)} • Z {status.z!.toFixed(1)}
                    {latest && ` • pada usia ${latest.ageMonths} bln`}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs data-tour="growth-panel" defaultValue="pertumbuhan">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger data-tour-tab="growth-pertumbuhan" value="pertumbuhan">
            <Scale className="h-4 w-4" /> Pertumbuhan
          </TabsTrigger>
          <TabsTrigger data-tour-tab="growth-imunisasi" value="imunisasi">
            <Syringe className="h-4 w-4" /> Imunisasi
          </TabsTrigger>
          <TabsTrigger data-tour-tab="growth-gigi" value="gigi">
            <Smile className="h-4 w-4" /> Gigi
          </TabsTrigger>
          <TabsTrigger data-tour-tab="growth-tidur" value="tidur">
            <Bed className="h-4 w-4" /> Tidur
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pertumbuhan">
          <GrowthTab records={records} childId={activeId} dob={child.dob} gender={child.gender} />
        </TabsContent>
        <TabsContent value="imunisasi">
          <ImmunizationTab />
        </TabsContent>
        <TabsContent value="gigi">
          <TeethTab />
        </TabsContent>
        <TabsContent value="tidur">
          <SleepTab ageMonths={age.months} />
        </TabsContent>
      </Tabs>

      {/* Milestone cross-link */}
      <Card className="bg-gradient-to-br from-gold-50 to-background">
        <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-100 text-gold-700">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display font-bold text-navy">
                Milestone perkembangan
              </p>
              <p className="text-sm text-navy-muted">
                Tandai pencapaian motorik, bahasa, kognitif & sosial di halaman
                Goal & Milestone.
              </p>
            </div>
          </div>
          <Button variant="outline" asChild>
            <Link href="/goals">
              Buka Milestone <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Pertumbuhan ---------- */
function approxDate(dob: string, ageMonths: number): string {
  const d = new Date(dob);
  d.setMonth(d.getMonth() + ageMonths);
  return d.toISOString().slice(0, 10);
}

function GrowthTab({
  records,
  childId,
  dob,
  gender,
}: {
  records: GrowthRecord[];
  childId: string;
  dob: string;
  gender: Gender;
}) {
  const deleteRecord = useAppStore((s) => s.deleteGrowthRecord);

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Belum ada data pengukuran. Klik “Tambah Pengukuran”.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <Tabs defaultValue="weight">
            <TabsList>
              {metricMeta.map((m) => (
                <TabsTrigger key={m.key} value={m.key}>
                  <m.icon className="h-4 w-4" /> {m.short}
                </TabsTrigger>
              ))}
            </TabsList>
            {metricMeta.map((m) => (
              <TabsContent key={m.key} value={m.key}>
                <WhoGrowthChart data={records} metric={m.key} sex={gender} />
                <Legend />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Interactive measurement table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catatan Pengukuran</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-semibold sm:px-6">Tanggal</th>
                  <th className="px-3 py-3 font-semibold">Usia</th>
                  <th className="px-3 py-3 font-semibold">Berat</th>
                  <th className="px-3 py-3 font-semibold">Tinggi</th>
                  <th className="px-3 py-3 font-semibold">LK</th>
                  <th className="px-3 py-3 font-semibold">Catatan</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((r, i) => (
                  <tr
                    key={r.id ?? `${r.ageMonths}-${r.date ?? i}`}
                    className="border-b align-top last:border-0 hover:bg-muted/40"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-navy sm:px-6">
                      {formatDateID(r.date ?? approxDate(dob, r.ageMonths))}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-navy-muted">
                      {r.ageMonths} bln
                    </td>
                    <td className="px-3 py-3 text-navy-muted">
                      {r.weight ? `${r.weight} kg` : "—"}
                    </td>
                    <td className="px-3 py-3 text-navy-muted">
                      {r.height ? `${r.height} cm` : "—"}
                    </td>
                    <td className="px-3 py-3 text-navy-muted">
                      {r.headCirc ? `${r.headCirc} cm` : "—"}
                    </td>
                    <td className="max-w-[180px] px-3 py-3 text-xs text-navy-muted">
                      {r.note || "—"}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => {
                          if (r.id) {
                            deleteRecord(childId, r.id);
                            toast("Pengukuran dihapus");
                          }
                        }}
                        className="text-muted-foreground transition-colors hover:text-alert-red"
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-navy-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-5 rounded-sm bg-sage/20" /> Rentang normal WHO
        (p3–p97)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-0 w-5 border-t-2 border-dashed border-gray-400" />{" "}
        Median WHO
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1 w-5 rounded-full bg-gold-500" /> Data {`anak`}
      </span>
    </div>
  );
}

/* ---------- Imunisasi ---------- */
const immunStatusMeta: Record<
  ImmunizationStatus,
  { label: string; variant: "success" | "warning" | "secondary" }
> = {
  selesai: { label: "Selesai", variant: "success" },
  dijadwalkan: { label: "Dijadwalkan", variant: "warning" },
  "akan-datang": { label: "Akan datang", variant: "secondary" },
};

function ImmunizationTab() {
  const activeId = useAppStore((s) => s.activeChildId);
  const list = useAppStore((s) => s.immunizations[s.activeChildId]) ?? [];
  const setStatus = useAppStore((s) => s.setImmunizationStatus);

  const done = list.filter((i) => i.status === "selesai").length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-navy">
              {done} dari {list.length} imunisasi selesai
            </p>
            <p className="text-sm text-navy-muted">Acuan jadwal IDAI</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-40 sm:w-48">
              <Progress value={pct} indicatorClassName="bg-sage" />
              <p className="mt-1.5 text-right text-sm font-bold text-sage">{pct}%</p>
            </div>
            <ImmunizationDialog />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          {list.map((im) => (
            <div
              key={im.id}
              className="flex flex-col gap-3 rounded-xl border bg-background p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-start gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                    im.status === "selesai"
                      ? "bg-sage-soft text-sage"
                      : "bg-gold-100 text-gold-700",
                  )}
                >
                  <Syringe className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-navy">{im.vaccine}</p>
                  <p className="text-xs text-navy-muted">
                    Usia {im.ageLabel}
                    {im.date && ` • ${formatDateID(im.date)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={immunStatusMeta[im.status].variant}>
                  {immunStatusMeta[im.status].label}
                </Badge>
                {im.status !== "selesai" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setStatus(activeId, im.id, "selesai");
                      toast.success("Imunisasi ditandai selesai", {
                        description: im.vaccine,
                      });
                    }}
                  >
                    <Check className="h-4 w-4" /> Selesai
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-navy-muted"
                    onClick={() => {
                      setStatus(activeId, im.id, "dijadwalkan");
                      toast("Tanda selesai dibatalkan", {
                        description: im.vaccine,
                      });
                    }}
                  >
                    <RotateCcw className="h-4 w-4" /> Batalkan
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Gigi ---------- */
function TeethTab() {
  const activeId = useAppStore((s) => s.activeChildId);
  const teeth = useAppStore((s) => s.teeth[s.activeChildId]) ?? [];
  const toggle = useAppStore((s) => s.toggleTooth);
  const count = teeth.filter((t) => t.erupted).length;

  return (
    <div className="space-y-4">
      <Card className="bg-navy text-cream">
        <CardContent className="flex items-center gap-4 p-6">
          <Smile className="h-9 w-9 text-gold-400" />
          <div>
            <p className="font-display text-2xl font-extrabold">
              {count} gigi <span className="text-base font-medium text-cream/70">sudah tumbuh</span>
            </p>
            <p className="text-sm text-cream/70">
              Tandai gigi saat pertama kali muncul.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-xs text-navy-muted">
            Tap kartu untuk menandai gigi sudah tumbuh — tanggal otomatis
            tercatat. Tap lagi untuk membatalkan.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {teeth.map((t) => (
              <button
                key={t.id}
                onClick={() => toggle(activeId, t.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  t.erupted
                    ? "border-sage/40 bg-sage-soft"
                    : "bg-background hover:bg-muted/50",
                )}
              >
                <ToothIcon erupted={t.erupted} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy">{t.name}</p>
                  <p className="text-xs text-navy-muted">
                    Biasanya {t.typicalAgeLabel}
                    {t.erupted && t.date && ` • ${formatDateID(t.date)}`}
                  </p>
                </div>
                {t.erupted && (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage text-white">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Tidur ---------- */
function SleepTab({ ageMonths }: { ageMonths: number }) {
  const logs = useAppStore((s) => s.sleepLogs[s.activeChildId]) ?? [];
  const idealIndex =
    ageMonths <= 3 ? 0 : ageMonths <= 11 ? 1 : ageMonths <= 24 ? 2 : 3;
  const [lo, hi] = idealSleepRange(ageMonths);
  const recent = [...logs].reverse().slice(0, 7);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Bed className="h-5 w-5 text-gold-600" />
            <CardTitle className="text-base">Catatan Tidur</CardTitle>
          </div>
          <SleepDialog />
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-navy-muted">
            Ideal untuk usia ini: <strong>{lo}–{hi} jam</strong> total per hari.
          </p>
          {recent.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Belum ada catatan tidur. Klik “Catat Tidur”.
            </p>
          )}
          {recent.map((l) => {
            const total = l.nightHours + l.napHours;
            const status =
              total < lo
                ? { label: "Kurang", variant: "warning" as const }
                : total > hi
                  ? { label: "Berlebih", variant: "warning" as const }
                  : { label: "Ideal", variant: "success" as const };
            return (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-xl border bg-background px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">
                    {formatDateID(l.date)}
                  </p>
                  <p className="text-xs text-navy-muted">
                    Malam {l.nightHours} jam • Siang {l.napHours} jam
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="font-display text-lg font-bold text-gold-700">
                    {total} jam
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <Bed className="h-5 w-5 text-gold-600" />
          <CardTitle className="text-base">Durasi Tidur Ideal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sleepIdeal.map((s, i) => (
            <div
              key={s.range}
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3",
                i === idealIndex ? "border-gold-300 bg-gold-50" : "bg-background",
              )}
            >
              <span className="text-sm font-semibold text-navy">
                {s.range}
                {i === idealIndex && (
                  <Badge variant="gold" className="ml-2">
                    Usia anak saat ini
                  </Badge>
                )}
              </span>
              <span className="text-sm font-bold text-gold-700">{s.hours}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-start gap-3 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-soft-orange" />
          <p className="text-sm text-navy-muted">
            Tidur cukup mendukung perkembangan otak dan pertumbuhan fisik. Durasi
            ini termasuk tidur siang. Sumber: rekomendasi tidur anak WHO/AAP.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
