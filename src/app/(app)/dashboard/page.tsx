"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookHeart,
  CalendarHeart,
  CheckCircle2,
  Circle,
  ClipboardList,
  Flame,
  Lightbulb,
  ListTodo,
  Plus,
  Repeat,
  Sparkles,
  Syringe,
  Target,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardGuide } from "@/components/app/dashboard-guide";
import { useAppStore } from "@/store/app-store";
import { MOOD_META, resurfaceMemory } from "@/lib/journal";
import { dailyActivity } from "@/lib/daily-activities";
import { cn, formatDateID, getAge, initials } from "@/lib/utils";

const priorityLabel: Record<string, string> = {
  tinggi: "Tinggi",
  sedang: "Sedang",
  rendah: "Rendah",
};

export default function DashboardPage() {
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const tasks = useAppStore((s) => s.tasks);
  const todos = useAppStore((s) => s.todos);
  const habits = useAppStore((s) => s.habits);
  const milestonesMap = useAppStore((s) => s.milestones);
  const goals = useAppStore((s) => s.goals);
  const immunizationsMap = useAppStore((s) => s.immunizations);
  const growthMap = useAppStore((s) => s.growth);
  const journalMap = useAppStore((s) => s.journal);
  const setTaskStatus = useAppStore((s) => s.setTaskStatus);
  const checkInHabit = useAppStore((s) => s.checkInHabit);
  const toggleTodo = useAppStore((s) => s.toggleTodo);

  const child = children.find((c) => c.id === activeId) ?? children[0];
  const age = getAge(child.dob);
  const milestones = milestonesMap[activeId] ?? [];

  // Daily ritual: one age-appropriate activity + a resurfaced journal memory.
  const activity = dailyActivity(age.months);
  const memory = resurfaceMemory(journalMap[activeId] ?? []);

  const childTasks = tasks.filter((t) => !t.childId || t.childId === activeId);
  const openTasks = childTasks.filter((t) => t.status !== "done");
  const childTodos = todos.filter((t) => !t.childId || t.childId === activeId);
  const todosDone = childTodos.filter((t) => t.done).length;
  const childHabits = habits.filter((h) => !h.childId || h.childId === activeId);
  const habitsDone = childHabits.filter((h) => h.history[h.history.length - 1]).length;
  const achieved = milestones.filter((m) => m.status === "bisa").length;

  // streak = best active-habit streak (replaces the former hard-coded constant)
  const streak = childHabits.reduce((m, h) => Math.max(m, h.streak), 0);

  // priority reminders derived from real data (no hard-coded placeholders)
  const childImmunizations = immunizationsMap[activeId] ?? [];
  const nextImmun = [...childImmunizations]
    .filter((im) => im.status !== "selesai")
    .sort((a, b) => a.ageMonths - b.ageMonths)[0];
  const childGrowth = growthMap[activeId] ?? [];
  const lastGrowth = childGrowth[childGrowth.length - 1];

  // upcoming milestones: not yet achieved, nearest to current age
  const upcoming = [...milestones]
    .filter((m) => m.status !== "bisa")
    .sort((a, b) => Math.abs(a.ageMinMonths - age.months) - Math.abs(b.ageMinMonths - age.months))
    .slice(0, 3);

  const stats = [
    {
      label: "Task hari ini",
      value: `${openTasks.length}`,
      sub: "perlu diselesaikan",
      icon: ClipboardList,
      color: "bg-gold-100 text-gold-700",
      href: "/tasks",
    },
    {
      label: "Rutinitas hari ini",
      value: `${todosDone}/${childTodos.length}`,
      sub: "selesai",
      icon: ListTodo,
      color: "bg-sage-soft text-sage",
      href: "/routines",
    },
    {
      label: "Kebiasaan check-in",
      value: `${habitsDone}/${childHabits.length}`,
      sub: "hari ini",
      icon: Repeat,
      color: "bg-soft-orange-soft text-soft-orange",
      href: "/routines",
    },
    {
      label: "Milestone tercapai",
      value: `${achieved}/${milestones.length}`,
      sub: "total",
      icon: Target,
      color: "bg-navy/10 text-navy",
      href: "/goals",
    },
  ];

  return (
    <div className="space-y-6">
      <DashboardGuide />

      {/* Welcome banner */}
      <div
        data-tour="dashboard-hero"
        className="relative overflow-hidden rounded-3xl bg-navy p-6 text-cream sm:p-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gold-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-gold-400">
              <AvatarImage src={child.photoUrl} alt={child.name} />
              <AvatarFallback>{initials(child.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-cream/70">Selamat pagi, Bunda 👋</p>
              <h2 className="font-display text-2xl font-extrabold">
                {child.name}
              </h2>
              <p className="text-sm text-gold-300">{age.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cream/10 px-5 py-3 text-center">
              <p className="flex items-center justify-center gap-1.5 font-display text-2xl font-extrabold text-gold-400">
                <Flame className="h-5 w-5" /> {streak}
              </p>
              <p className="text-xs text-cream/70">hari beruntun</p>
            </div>
            <Button variant="navy" className="border border-cream/20" asChild>
              <Link href="/tasks">
                <Plus /> Tambah Task
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Daily ritual */}
      <Card
        data-tour="dashboard-ritual"
        className="border-gold-200 bg-gradient-to-br from-gold-50 to-background"
      >
        <CardContent className="space-y-3 p-5">
          <p className="flex items-center gap-2 font-display font-bold text-navy">
            <Sparkles className="h-5 w-5 text-gold-600" /> Momen Hari Ini
          </p>

          {/* One age-appropriate activity */}
          <div className="flex items-start gap-3 rounded-xl border bg-background p-4">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sage-soft text-sage">
              <Lightbulb className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-wide text-sage">
                Ide stimulasi 2 menit • {activity.domain}
              </p>
              <p className="text-sm font-semibold text-navy">{activity.title}</p>
              <p className="text-xs text-navy-muted">{activity.detail}</p>
            </div>
          </div>

          {/* A resurfaced memory (or a nudge to write the first one) */}
          {memory ? (
            <Link
              href="/journal"
              className="flex items-start gap-3 rounded-xl border bg-background p-4 transition-colors hover:border-gold-300"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg",
                  memory.entry.mood
                    ? MOOD_META[memory.entry.mood].cls
                    : "bg-gold-100 text-gold-700",
                )}
              >
                {memory.entry.mood ? (
                  MOOD_META[memory.entry.mood].emoji
                ) : (
                  <BookHeart className="h-[18px] w-[18px]" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gold-700">
                  {memory.label} • {formatDateID(memory.entry.date)}
                </p>
                <p className="truncate text-sm font-semibold text-navy">
                  {memory.entry.title ?? memory.entry.body}
                </p>
                <p className="truncate text-xs text-navy-muted">
                  {memory.entry.title ? memory.entry.body : "Buka Jurnal Emas →"}
                </p>
              </div>
            </Link>
          ) : (
            <Link
              href="/journal"
              className="flex items-center gap-3 rounded-xl border border-dashed bg-background p-4 transition-colors hover:border-gold-300"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gold-100 text-gold-700">
                <BookHeart className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">
                  Tulis kenangan pertamamu
                </p>
                <p className="text-xs text-navy-muted">
                  Abadikan momen kecil {child.name} hari ini di Jurnal Emas →
                </p>
              </div>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div data-tour="dashboard-stats" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-5">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-display text-2xl font-extrabold text-navy">
                  {s.value}
                </p>
                <p className="text-xs text-navy-muted">{s.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div data-tour="dashboard-today" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Task Hari Ini</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/tasks">
                Lihat semua <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {openTasks.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Semua task selesai. Kerja bagus! 🎉
              </p>
            )}
            {openTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-muted/50"
              >
                <button
                  onClick={() => {
                    setTaskStatus(t.id, "done");
                    toast.success("Task selesai!", { description: t.title });
                  }}
                  className="text-muted-foreground transition-colors hover:text-sage"
                >
                  <Circle className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">
                    {t.title}
                  </p>
                  <p className="text-xs text-navy-muted">{t.category}</p>
                </div>
                <Badge
                  variant={
                    t.priority === "tinggi"
                      ? "destructive"
                      : t.priority === "sedang"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {priorityLabel[t.priority]}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Priority / reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Pengingat Prioritas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/growth"
              className="block rounded-xl border border-soft-orange/30 bg-soft-orange-soft p-4 transition-colors hover:border-soft-orange"
            >
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-soft-orange">
                <Syringe className="h-4 w-4" /> Imunisasi
              </p>
              {nextImmun ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    {nextImmun.vaccine}
                  </p>
                  <p className="text-xs text-navy-muted">
                    Usia {nextImmun.ageLabel}
                    {nextImmun.date ? ` • ${formatDateID(nextImmun.date)}` : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    Imunisasi terkini ✓
                  </p>
                  <p className="text-xs text-navy-muted">
                    Tidak ada jadwal yang menunggu
                  </p>
                </>
              )}
            </Link>
            <Link
              href="/growth"
              className="block rounded-xl border border-gold-200 bg-gold-50 p-4 transition-colors hover:border-gold-400"
            >
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gold-700">
                <CalendarHeart className="h-4 w-4" /> Penimbangan
              </p>
              {lastGrowth ? (
                <>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    Pemantauan pertumbuhan
                  </p>
                  <p className="text-xs text-navy-muted">
                    Terakhir:{" "}
                    {lastGrowth.date
                      ? formatDateID(lastGrowth.date)
                      : `usia ${lastGrowth.ageMonths} bln`}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-1 text-sm font-semibold text-navy">
                    Belum ada penimbangan
                  </p>
                  <p className="text-xs text-navy-muted">
                    Tambah pengukuran pertama
                  </p>
                </>
              )}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming milestones */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Milestone Terdekat</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/goals">
                Lihat semua <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-xl border bg-background p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
                  <Target className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">
                    {m.title}
                  </p>
                  <p className="text-xs text-navy-muted">
                    {m.domain} • {m.ageMinMonths}–{m.ageMaxMonths} bln
                  </p>
                </div>
                {m.isCritical && <Badge variant="destructive">Penting</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Habit quick check-in */}
        <Card>
          <CardHeader>
            <CardTitle>Check-in Kebiasaan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {childHabits.slice(0, 4).map((h) => {
              const done = h.history[h.history.length - 1];
              return (
                <button
                  key={h.id}
                  onClick={() => checkInHabit(h.id)}
                  className="flex w-full items-center gap-3 rounded-xl border bg-background p-3 text-left transition-colors hover:bg-muted/50"
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-sage" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">
                    {h.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-soft-orange">
                    <Flame className="h-3.5 w-3.5" /> {h.streak}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Goal progress */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold-600" /> Progress Goal
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/goals">
              Kelola goal <ArrowRight />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {goals.map((g) => (
            <div key={g.id} className="rounded-xl border bg-background p-4">
              <p className="text-sm font-semibold text-navy">{g.title}</p>
              <p className="mt-0.5 text-xs text-navy-muted">{g.domain}</p>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={g.progress} className="flex-1" />
                <span className="text-sm font-bold text-gold-700">
                  {g.progress}%
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
