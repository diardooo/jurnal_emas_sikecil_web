"use client";

import { useState } from "react";
import {
  Baby,
  Bell,
  CheckCircle2,
  Circle,
  CloudSun,
  Flame,
  Lightbulb,
  Moon,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { HabitDialog } from "@/components/app/habit-dialog";
import { HabitHeatmap } from "@/components/app/habit-heatmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { ACTIVITIES } from "@/lib/daily-activities";
import { cn } from "@/lib/utils";
import type { Habit, TodoCategory } from "@/lib/types";

const STIMULASI_TITLES = new Set(
  Object.values(ACTIVITIES).flatMap((acts) => acts.map((a) => a.title)),
);

const categoryMeta: Record<TodoCategory, { icon: typeof Sun; color: string }> = {
  "Rutinitas Pagi": { icon: Sun, color: "bg-gold-100 text-gold-700" },
  Siang: { icon: CloudSun, color: "bg-soft-orange-soft text-soft-orange" },
  Malam: { icon: Moon, color: "bg-navy/10 text-navy" },
  "Jadwal Anak": { icon: Baby, color: "bg-sage-soft text-sage" },
};
const allCategories: TodoCategory[] = [
  "Rutinitas Pagi",
  "Siang",
  "Malam",
  "Jadwal Anak",
];

export default function RoutinesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rutinitas"
        description="Checklist hari ini yang segar tiap pagi, plus kebiasaan yang kamu rawat pelan-pelan."
        action={<HabitDialog />}
      />

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">
            <Sun className="h-4 w-4" /> Hari Ini
          </TabsTrigger>
          <TabsTrigger value="habits">
            <Flame className="h-4 w-4" /> Kebiasaan & Konsistensi
          </TabsTrigger>
        </TabsList>
        <TabsContent value="today">
          <TodayTab />
        </TabsContent>
        <TabsContent value="habits">
          <HabitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------- Hari Ini (daily checklist) ---------- */
function TodayTab() {
  const todos = useAppStore((s) => s.todos);
  const activeId = useAppStore((s) => s.activeChildId);
  const toggle = useAppStore((s) => s.toggleTodo);
  const add = useAppStore((s) => s.addTodo);
  const remove = useAppStore((s) => s.deleteTodo);

  const childTodos = todos.filter((t) => !t.childId || t.childId === activeId);
  const done = childTodos.filter((t) => t.done).length;
  const pct = childTodos.length
    ? Math.round((done / childTodos.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <Card className="bg-navy text-cream">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold">
              {done} dari {childTodos.length} selesai hari ini
            </p>
            <p className="text-sm text-cream/70">
              {pct === 100
                ? "Luar biasa! Semua rutinitas tuntas 🎉"
                : "Checklist ini otomatis disegarkan setiap pagi."}
            </p>
          </div>
          <div className="sm:w-56">
            <Progress
              value={pct}
              className="bg-cream/20"
              indicatorClassName="bg-gold-400"
            />
            <p className="mt-1.5 text-right text-sm font-bold text-gold-400">
              {pct}%
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {allCategories.map((cat) => (
          <CategoryCard
            key={cat}
            category={cat}
            items={childTodos.filter((t) => t.category === cat)}
            onToggle={toggle}
            onRemove={remove}
            onAdd={(title) => {
              add({
                id: `d-${Date.now()}`,
                title,
                category: cat,
                done: false,
                childId: activeId,
              });
              toast.success("Item ditambahkan");
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  items,
  onToggle,
  onRemove,
  onAdd,
}: {
  category: TodoCategory;
  items: { id: string; title: string; done: boolean }[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: (title: string) => void;
}) {
  const [value, setValue] = useState("");
  const meta = categoryMeta[category];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <span className={cn("grid h-9 w-9 place-items-center rounded-xl", meta.color)}>
          <meta.icon className="h-5 w-5" />
        </span>
        <CardTitle>{category}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((t) => (
          <div key={t.id} className="group flex items-center gap-3 rounded-lg px-1 py-1.5">
            <Checkbox checked={t.done} onCheckedChange={() => onToggle(t.id)} id={t.id} />
            <label
              htmlFor={t.id}
              className={cn(
                "flex-1 cursor-pointer text-sm font-medium text-navy",
                t.done && "text-muted-foreground line-through",
              )}
            >
              {t.title}
            </label>
            <button
              onClick={() => onRemove(t.id)}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-alert-red group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            Belum ada item.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!value.trim()) return;
            onAdd(value);
            setValue("");
          }}
          className="flex items-center gap-2 pt-2"
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tambah item cepat…"
            className="h-9"
          />
          <Button size="icon" type="submit" className="h-9 w-9 shrink-0">
            <Plus />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------- Kebiasaan & Konsistensi (habits) ---------- */
function HabitsTab() {
  const habits = useAppStore((s) => s.habits);
  const activeId = useAppStore((s) => s.activeChildId);
  const checkIn = useAppStore((s) => s.checkInHabit);
  const remove = useAppStore((s) => s.deleteHabit);

  const childHabits = habits.filter((h) => !h.childId || h.childId === activeId);
  const totalCheckins = childHabits.reduce(
    (sum, h) => sum + h.history.filter(Boolean).length,
    0,
  );
  const bestStreak = childHabits.reduce((m, h) => Math.max(m, h.streak), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatBox label="Kebiasaan aktif" value={`${childHabits.length}`} />
        <StatBox label="Rekor beruntun" value={`${bestStreak} hari`} accent />
        <StatBox
          label="Total centang"
          value={`${totalCheckins}`}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {childHabits.map((h) => (
        <HabitCard
          key={h.id}
          habit={h}
          onCheckIn={() => {
            const doneToday = h.history[h.history.length - 1];
            checkIn(h.id);
            if (!doneToday)
              toast.success("Mantap, satu lagi kelar! 🎉", { description: h.name });
          }}
          onRemove={() => {
            remove(h.id);
            toast("Kebiasaan dihapus");
          }}
        />
      ))}
      {childHabits.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-3xl">🌱</p>
            <p className="mt-2 text-sm font-semibold text-navy">
              Belum ada kebiasaan
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Mulai dari satu hal kecil. Tekan “Tambah Kebiasaan” di atas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/** Consistency over the last 28 days (matches the heatmap window). */
function consistency(history: boolean[]) {
  const recent = history.slice(-28);
  const done = recent.filter(Boolean).length;
  const pct = recent.length ? Math.round((done / recent.length) * 100) : 0;
  // color ramp: red → orange → green
  const tone =
    pct < 40
      ? { ring: "#E63946", soft: "bg-alert-red-soft", text: "text-alert-red", label: "Perlu didorong" }
      : pct < 70
        ? { ring: "#F4A261", soft: "bg-soft-orange-soft", text: "text-soft-orange", label: "Lumayan" }
        : { ring: "#7BA05B", soft: "bg-sage-soft", text: "text-sage", label: "Konsisten!" };
  return { pct, ...tone };
}

function HabitCard({
  habit: h,
  onCheckIn,
  onRemove,
}: {
  habit: Habit;
  onCheckIn: () => void;
  onRemove: () => void;
}) {
  const doneToday = h.history[h.history.length - 1];
  const c = consistency(h.history);
  const isStimulasi =
    h.category === "Stimulasi Harian" && STIMULASI_TITLES.has(h.name);

  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
        {/* left: check + info */}
        <div className="flex flex-1 items-start gap-4">
          <button onClick={onCheckIn} className="mt-0.5 shrink-0" aria-label="Centang">
            {doneToday ? (
              <CheckCircle2 className="h-9 w-9 text-sage" />
            ) : (
              <Circle className="h-9 w-9 text-muted-foreground/40 transition-colors hover:text-sage" />
            )}
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-base font-bold text-navy">{h.name}</p>
              <Badge variant="secondary">{h.category}</Badge>
              {isStimulasi && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-semibold text-sage">
                  <Lightbulb className="h-3 w-3" /> Ide Aplikasi
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-muted">
              <span className="flex items-center gap-1 font-semibold text-soft-orange">
                <Flame className="h-3.5 w-3.5" /> {h.streak} hari beruntun
              </span>
              <span>Target {h.targetPerWeek}x/minggu</span>
              {h.reminderTime && (
                <span className="flex items-center gap-1">
                  <Bell className="h-3.5 w-3.5" /> {h.reminderTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* consistency ring */}
        <div className="flex items-center gap-3">
          <ConsistencyRing pct={c.pct} color={c.ring} />
          <div>
            <p className={cn("text-sm font-bold", c.text)}>{c.label}</p>
            <p className="text-xs text-navy-muted">Konsistensi 4 minggu</p>
          </div>
        </div>

        {/* heatmap (always visible, bigger, last 4 weeks) */}
        <div className="flex items-center gap-4">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
              4 minggu terakhir
            </p>
            <HabitHeatmap history={h.history} weeks={4} />
          </div>
          <button
            onClick={onRemove}
            className="text-muted-foreground transition-colors hover:text-alert-red"
            aria-label="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConsistencyRing({ pct, color }: { pct: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 52 52" className="h-14 w-14 -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="#EDE6D4" strokeWidth="6" />
        <circle
          cx="26"
          cy="26"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-sm font-extrabold text-navy">
        {pct}%
      </span>
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
  className,
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <p
          className={cn(
            "font-display text-2xl font-extrabold",
            accent ? "text-gold-600" : "text-navy",
          )}
        >
          {value}
        </p>
        <p className="text-xs text-navy-muted">{label}</p>
      </CardContent>
    </Card>
  );
}
