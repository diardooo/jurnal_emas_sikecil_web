"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock,
  Columns3,
  Info,
  List,
  Repeat,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { TaskDialog } from "@/components/app/task-dialog";
import { TaskOverview } from "@/components/app/task-overview";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { cn, deadlineInfo, formatDateID } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";

const priorityMeta = {
  tinggi: { label: "Tinggi", variant: "destructive" as const },
  sedang: { label: "Sedang", variant: "warning" as const },
  rendah: { label: "Rendah", variant: "secondary" as const },
};

const columns: { key: TaskStatus; title: string; accent: string }[] = [
  { key: "todo", title: "Akan Dikerjakan", accent: "border-t-gold-400" },
  { key: "progress", title: "Sedang Dikerjakan", accent: "border-t-soft-orange" },
  { key: "done", title: "Selesai", accent: "border-t-sage" },
];

const deadlineTone: Record<string, string> = {
  overdue: "bg-alert-red-soft text-alert-red",
  soon: "bg-soft-orange-soft text-soft-orange",
  upcoming: "bg-muted text-navy-muted",
  none: "bg-muted text-muted-foreground",
};

function DeadlineChip({ dueDate, done }: { dueDate?: string; done?: boolean }) {
  const info = deadlineInfo(dueDate, done);
  if (!info) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        deadlineTone[info.tone],
      )}
    >
      <Clock className="h-3 w-3" /> {info.label}
    </span>
  );
}

export default function TasksPage() {
  const tasks = useAppStore((s) => s.tasks);
  const activeId = useAppStore((s) => s.activeChildId);
  const allCategories = useAppStore((s) => s.taskCategories);
  const setStatus = useAppStore((s) => s.setTaskStatus);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const [category, setCategory] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");

  const childTasks = useMemo(
    () => tasks.filter((t) => !t.childId || t.childId === activeId),
    [tasks, activeId],
  );
  const filtered = useMemo(
    () =>
      childTasks.filter(
        (t) =>
          (category === "all" || t.category === category) &&
          (priority === "all" || t.priority === priority),
      ),
    [childTasks, category, priority],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Manager"
        description="Daftar hal yang perlu diurus untuk si Kecil — yang dikerjakan sekali & punya tenggat."
        action={<TaskDialog />}
      />

      {/* Info: beda Task vs Rutinitas */}
      <div className="flex items-start gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
        <div className="text-sm text-navy">
          <p>
            <strong>Task</strong> = urusan <strong>sekali jadi</strong> yang punya
            tenggat (mis. <em>jadwalkan imunisasi, urus akta lahir, beli
            perlengkapan MPASI</em>).
          </p>
          <p className="mt-1 text-navy-muted">
            Butuh checklist harian yang berulang seperti “tummy time” atau
            “bacakan buku”?{" "}
            <Link href="/routines" className="inline-flex items-center gap-1 font-semibold text-gold-700 hover:underline">
              <Repeat className="h-3.5 w-3.5" /> Gunakan menu Rutinitas
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Mini dashboard */}
      <TaskOverview tasks={childTasks} />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {allCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioritas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prioritas</SelectItem>
            <SelectItem value="tinggi">Tinggi</SelectItem>
            <SelectItem value="sedang">Sedang</SelectItem>
            <SelectItem value="rendah">Rendah</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="list">
        <TabsList data-tour="task-views">
          <TabsTrigger value="list">
            <List className="h-4 w-4" /> List
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <Columns3 className="h-4 w-4" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4" /> Kalender
          </TabsTrigger>
        </TabsList>

        {/* LIST */}
        <TabsContent value="list">
          <Card>
            <CardContent className="divide-y p-0">
              {filtered.length === 0 && (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Tidak ada task untuk filter ini.
                </p>
              )}
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => {
                      setStatus(t.id, t.status === "done" ? "todo" : "done");
                      if (t.status !== "done")
                        toast.success("Task selesai!", { description: t.title });
                    }}
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      t.status === "done"
                        ? "border-sage bg-sage text-white"
                        : "border-muted-foreground/40 text-transparent hover:border-sage",
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold text-navy",
                        t.status === "done" && "text-muted-foreground line-through",
                      )}
                    >
                      {t.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-navy-muted">{t.category}</span>
                      <DeadlineChip dueDate={t.dueDate} done={t.status === "done"} />
                    </div>
                  </div>
                  <Badge variant={priorityMeta[t.priority].variant}>
                    {priorityMeta[t.priority].label}
                  </Badge>
                  <button
                    onClick={() => {
                      deleteTask(t.id);
                      toast("Task dihapus");
                    }}
                    className="text-muted-foreground transition-colors hover:text-alert-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* KANBAN */}
        <TabsContent value="kanban">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {columns.map((col) => {
              const items = filtered.filter((t) => t.status === col.key);
              return (
                <div
                  key={col.key}
                  className={cn("rounded-2xl border border-t-4 bg-card p-4", col.accent)}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-sm font-bold text-navy">
                      {col.title}
                    </h3>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((t) => (
                      <KanbanCard
                        key={t.id}
                        task={t}
                        onMove={(dir) => {
                          const order: TaskStatus[] = ["todo", "progress", "done"];
                          const idx = order.indexOf(t.status);
                          const nextIdx = Math.min(
                            order.length - 1,
                            Math.max(0, idx + dir),
                          );
                          setStatus(t.id, order[nextIdx]);
                        }}
                      />
                    ))}
                    {items.length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        Kosong
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* CALENDAR */}
        <TabsContent value="calendar">
          <CalendarView tasks={filtered} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KanbanCard({ task, onMove }: { task: Task; onMove: (dir: number) => void }) {
  return (
    <div className="rounded-xl border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-navy">{task.title}</p>
        <Badge variant={priorityMeta[task.priority].variant}>
          {priorityMeta[task.priority].label}
        </Badge>
      </div>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-navy-muted">
          {task.description}
        </p>
      )}
      <div className="mt-2">
        <DeadlineChip dueDate={task.dueDate} done={task.status === "done"} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{task.category}</span>
        <div className="flex gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={task.status === "todo"}
            className="rounded-md border px-2 py-0.5 text-xs font-semibold disabled:opacity-40"
          >
            ←
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={task.status === "done"}
            className="rounded-md border px-2 py-0.5 text-xs font-semibold disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ tasks }: { tasks: Task[] }) {
  const year = 2026;
  const month = 5; // June
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const byDay = (day: number) =>
    tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-4 font-display text-lg font-bold text-navy">Juni 2026</p>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted-foreground">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1.5">
          {cells.map((day, i) => {
            const dayTasks = day ? byDay(day) : [];
            const isToday = day === 19;
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[84px] rounded-lg border p-1.5 text-left",
                  day ? "bg-background" : "border-transparent bg-transparent",
                  isToday && "border-gold-400 bg-gold-50",
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isToday ? "text-gold-700" : "text-navy",
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 2).map((t) => (
                        <p
                          key={t.id}
                          title={`${t.title} • ${formatDateID(t.dueDate!)}`}
                          className={cn(
                            "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                            t.priority === "tinggi"
                              ? "bg-alert-red-soft text-alert-red"
                              : "bg-gold-100 text-gold-700",
                          )}
                        >
                          {t.title}
                        </p>
                      ))}
                      {dayTasks.length > 2 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{dayTasks.length - 2} lagi
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
