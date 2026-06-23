"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { domainMeta } from "@/lib/domains";
import { agePhases, milestoneDomains, phaseOf } from "@/lib/mock-data";
import { cn, getAge } from "@/lib/utils";
import type { Milestone, MilestoneStatus } from "@/lib/types";

const statusMeta: Record<MilestoneStatus, { label: string; cls: string }> = {
  belum: { label: "Belum", cls: "bg-muted text-muted-foreground" },
  dicoba: { label: "Sedang Dicoba", cls: "bg-soft-orange-soft text-soft-orange" },
  bisa: { label: "Sudah Bisa", cls: "bg-sage-soft text-sage" },
};

export default function GoalsPage() {
  const milestonesMap = useAppStore((s) => s.milestones);
  const goals = useAppStore((s) => s.goals);
  const children = useAppStore((s) => s.children);
  const activeId = useAppStore((s) => s.activeChildId);
  const child = children.find((c) => c.id === activeId) ?? children[0];
  const childMonths = getAge(child.dob).months;
  const milestones = milestonesMap[activeId] ?? [];

  const [domain, setDomain] = useState<string>("all");

  const achieved = milestones.filter((m) => m.status === "bisa").length;
  const overallPct = milestones.length
    ? Math.round((achieved / milestones.length) * 100)
    : 0;
  const currentPhase = phaseOf(childMonths);

  const filtered = useMemo(
    () =>
      domain === "all"
        ? milestones
        : milestones.filter((m) => m.domain === domain),
    [milestones, domain],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goal & Milestone"
        description="Milestone 0–6 tahun per fase usia & domain, mengacu WHO, IDAI (KPSP) & Denver II."
      />

      <Card className="bg-gradient-to-br from-gold-50 to-background">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-navy-muted">Total milestone tercapai</p>
            <p className="font-display text-3xl font-extrabold text-navy">
              {achieved}
              <span className="text-lg text-navy-muted">/{milestones.length}</span>
            </p>
          </div>
          <div className="sm:w-72">
            <Progress value={overallPct} />
            <p className="mt-1.5 text-right text-sm font-bold text-gold-700">
              {overallPct}% perjalanan
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="milestone">
        <TabsList>
          <TabsTrigger value="milestone">Milestone Anak</TabsTrigger>
          <TabsTrigger value="goal">Goal Orang Tua</TabsTrigger>
        </TabsList>

        <TabsContent value="milestone" className="space-y-4">
          {/* Domain filter */}
          <div className="-mx-1 flex flex-wrap gap-2 px-1">
            <FilterChip active={domain === "all"} onClick={() => setDomain("all")}>
              Semua Domain
            </FilterChip>
            {milestoneDomains.map((d) => (
              <FilterChip
                key={d}
                active={domain === d}
                onClick={() => setDomain(d)}
              >
                {d}
              </FilterChip>
            ))}
          </div>

          {agePhases.map((phase) => {
            const items = filtered.filter(
              (m) => phaseOf(m.ageMinMonths) === phase.id,
            );
            if (items.length === 0) return null;
            return (
              <PhaseGroup
                key={phase.id}
                label={phase.label}
                isCurrent={phase.id === currentPhase}
                items={items}
              />
            );
          })}
        </TabsContent>

        <TabsContent value="goal" className="space-y-4">
          {goals.map((g) => (
            <GoalCard key={g.id} goalId={g.id} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-gold-400 bg-gold-500 text-navy"
          : "border-border bg-background text-navy-muted hover:border-gold-200",
      )}
    >
      {children}
    </button>
  );
}

function PhaseGroup({
  label,
  isCurrent,
  items,
}: {
  label: string;
  isCurrent: boolean;
  items: Milestone[];
}) {
  const [open, setOpen] = useState(isCurrent);
  const done = items.filter((m) => m.status === "bisa").length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <Card className={cn(isCurrent && "border-gold-300 ring-1 ring-gold-200")}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-100 font-display text-sm font-extrabold text-gold-700">
          {label.split(" ")[0]}
        </span>
        <div className="flex-1">
          <p className="flex items-center gap-2 font-display font-bold text-navy">
            {label}
            {isCurrent && <Badge variant="gold">Usia anak</Badge>}
          </p>
          <p className="text-xs text-navy-muted">
            {done}/{items.length} tercapai • {pct}%
          </p>
        </div>
        <div className="hidden w-32 sm:block">
          <Progress value={pct} />
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <CardContent className="space-y-3 border-t pt-4">
          {items.map((m) => (
            <MilestoneRow key={m.id} milestone={m} />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

/** Fallback for milestones whose admin-defined domain isn't in the known set. */
const fallbackDomainMeta = {
  icon: Target,
  color: "bg-muted text-muted-foreground",
  chip: "border-border bg-background text-navy-muted",
};

function MilestoneRow({ milestone: m }: { milestone: Milestone }) {
  const setStatus = useAppStore((s) => s.setMilestoneStatus);
  const meta = domainMeta[m.domain] ?? fallbackDomainMeta;
  const cycle: MilestoneStatus[] = ["belum", "dicoba", "bisa"];

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            meta.color,
          )}
        >
          <meta.icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-navy">{m.title}</p>
            {m.isCritical && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> Penting
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-navy-muted">{m.description}</p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {m.domain} • usia {m.ageMinMonths}–{m.ageMaxMonths} bulan
            {m.hasPhoto && (
              <span className="ml-2 inline-flex items-center gap-1 text-gold-700">
                <Camera className="h-3 w-3" /> Ada foto
              </span>
            )}
          </p>
          {m.note && (
            <p className="mt-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs italic text-navy-muted">
              “{m.note}”
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {cycle.map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatus(m.id, st);
              if (st === "bisa")
                toast.success("Milestone tercapai! 🎉", { description: m.title });
            }}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-all",
              m.status === st
                ? statusMeta[st].cls + " ring-2 ring-offset-1 ring-current/30"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {m.status === st && st === "bisa" && (
              <Check className="mr-1 inline h-3 w-3" />
            )}
            {statusMeta[st].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GoalCard({ goalId }: { goalId: string }) {
  const goal = useAppStore((s) => s.goals.find((g) => g.id === goalId))!;
  const toggle = useAppStore((s) => s.toggleSubGoal);

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700">
            <Target className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display font-bold text-navy">{goal.title}</p>
              <Badge variant="gold">{goal.progress}%</Badge>
            </div>
            {goal.description && (
              <p className="mt-0.5 text-sm text-navy-muted">{goal.description}</p>
            )}
            <Progress value={goal.progress} className="mt-3" />
            <div className="mt-4 space-y-2">
              {goal.subGoals.map((sub) => (
                <label
                  key={sub.id}
                  className="flex cursor-pointer items-center gap-3 text-sm"
                >
                  <Checkbox
                    checked={sub.done}
                    onCheckedChange={() => toggle(goal.id, sub.id)}
                  />
                  <span
                    className={cn(
                      "font-medium text-navy",
                      sub.done && "text-muted-foreground line-through",
                    )}
                  >
                    {sub.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
