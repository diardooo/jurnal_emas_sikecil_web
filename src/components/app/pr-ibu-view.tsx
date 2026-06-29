"use client";

import { useMemo, useState } from "react";
import { Check, Clock, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { useAppStore } from "@/store/app-store";
import { cn, deadlineInfo, formatDateID } from "@/lib/utils";
import type { Task } from "@/lib/types";

const priorityMeta = {
  tinggi: { label: "Tinggi", variant: "destructive" as const },
  sedang: { label: "Sedang", variant: "warning" as const },
  rendah: { label: "Rendah", variant: "secondary" as const },
};

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

/** "PR Ibu" — one-off errands with deadlines, shown as a list and a calendar
 *  side by side so a parent sees both at once. */
export function PrIbuView() {
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
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-navy-muted">
          Urusan <strong className="text-navy">sekali beres</strong> yang punya
          tenggat — mis. kontrol dokter, urus akta, beli MPASI.
        </p>
        <TaskDialog />
      </div>

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

      {/* List + Calendar together — list on the left, calendar on the right. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <TaskList
            tasks={filtered}
            onToggle={(t) => {
              setStatus(t.id, t.status === "done" ? "todo" : "done");
              if (t.status !== "done")
                toast.success("Task selesai!", { description: t.title });
            }}
            onDelete={(t) => {
              deleteTask(t.id);
              toast("Task dihapus");
            }}
          />
        </div>
        <div className="lg:col-span-3">
          <CalendarView tasks={filtered} />
        </div>
      </div>
    </div>
  );
}

function TaskList({
  tasks,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  onToggle: (t: Task) => void;
  onDelete: (t: Task) => void;
}) {
  return (
    <Card>
      <CardContent className="divide-y p-0">
        {tasks.length === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Tidak ada task untuk filter ini.
          </p>
        )}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-start gap-3 p-4">
            <button
              onClick={() => onToggle(t)}
              aria-label={t.status === "done" ? "Tandai belum" : "Tandai selesai"}
              className={cn(
                "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
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
              {t.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-navy-muted">
                  {t.description}
                </p>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs text-navy-muted">{t.category}</span>
                <Badge variant={priorityMeta[t.priority].variant}>
                  {priorityMeta[t.priority].label}
                </Badge>
                <DeadlineChip dueDate={t.dueDate} done={t.status === "done"} />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <TaskDialog
                task={t}
                trigger={
                  <button
                    aria-label="Edit task"
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-navy"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                }
              />
              <button
                onClick={() => onDelete(t)}
                aria-label="Hapus task"
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-alert-red-soft hover:text-alert-red"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** Real current-month calendar with tasks placed on their due dates. */
function CalendarView({ tasks }: { tasks: Task[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayDate = now.getDate();

  const startDay = (new Date(year, month, 1).getDay() + 6) % 7; // Mon-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthLabel = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(now);

  const byDay = (day: number) =>
    tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return (
        d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
      );
    });

  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-4 font-display text-lg font-bold capitalize text-navy">
          {monthLabel}
        </p>
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
            const isToday = day === todayDate;
            return (
              <div
                key={i}
                className={cn(
                  "min-h-[88px] rounded-lg border p-1.5 text-left transition-colors",
                  day ? "bg-background" : "border-transparent bg-transparent",
                  isToday && "border-gold-400 bg-gold-50 ring-1 ring-gold-200",
                )}
              >
                {day && (
                  <>
                    <span
                      className={cn(
                        "inline-grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
                        isToday
                          ? "bg-gold-500 text-navy"
                          : "text-navy",
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayTasks.slice(0, 3).map((t) => (
                        <p
                          key={t.id}
                          title={`${t.title}${t.dueDate ? ` • ${formatDateID(t.dueDate)}` : ""}`}
                          className={cn(
                            "truncate rounded px-1 py-0.5 text-[10px] font-medium",
                            t.status === "done"
                              ? "bg-sage-soft text-sage line-through"
                              : t.priority === "tinggi"
                                ? "bg-alert-red-soft text-alert-red"
                                : "bg-gold-100 text-gold-700",
                          )}
                        >
                          {t.title}
                        </p>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-[10px] text-muted-foreground">
                          +{dayTasks.length - 3} lagi
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
