"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Task } from "@/lib/types";

const palette = ["#C9A227", "#7BA05B", "#F4A261", "#1A1A2E", "#E63946", "#A8851F"];

export function TaskOverview({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.filter((t) => t.status === "progress").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const byCat = new Map<string, { done: number; total: number }>();
  for (const t of tasks) {
    const e = byCat.get(t.category) ?? { done: 0, total: 0 };
    e.total += 1;
    if (t.status === "done") e.done += 1;
    byCat.set(t.category, e);
  }
  const cats = Array.from(byCat.entries())
    .map(([name, v]) => ({
      name,
      ...v,
      pct: v.total ? Math.round((v.done / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Progress Keseluruhan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-end justify-between">
              <span className="font-display text-3xl font-extrabold text-navy">
                {pct}%
              </span>
              <span className="text-sm text-navy-muted">
                {done}/{total} selesai
              </span>
            </div>
            <Progress value={pct} className="mt-2" indicatorClassName="bg-sage" />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Akan" value={total - done - progress} tone="text-navy" />
            <Stat label="Proses" value={progress} tone="text-soft-orange" />
            <Stat label="Selesai" value={done} tone="text-sage" />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Selesai per Kategori</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cats.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Belum ada task.
            </p>
          )}
          {cats.map((c, i) => (
            <div key={c.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-navy">{c.name}</span>
                <span className="text-xs font-semibold text-navy-muted">
                  {c.done}/{c.total} selesai
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${c.pct}%`,
                    backgroundColor: palette[i % palette.length],
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border bg-background py-3">
      <p className={`font-display text-xl font-extrabold ${tone}`}>{value}</p>
      <p className="text-xs text-navy-muted">{label}</p>
    </div>
  );
}
