"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronDown,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  Plus,
  Target,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { GoalDialog } from "@/components/app/goal-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/store/app-store";
import { domainMeta } from "@/lib/domains";
import { agePhases, milestoneDomains, phaseOf } from "@/lib/mock-data";
import { cn, getAge } from "@/lib/utils";
import { evaluateRedFlags, type RedFlag } from "@/lib/red-flags";
import { activitiesForAge } from "@/lib/daily-activities";
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

  const redFlags = useMemo(
    () => evaluateRedFlags(childMonths, milestones),
    [childMonths, milestones],
  );

  const habits = useAppStore((s) => s.habits);
  const addHabit = useAppStore((s) => s.addHabit);
  const deleteHabit = useAppStore((s) => s.deleteHabit);
  const activities = activitiesForAge(childMonths);

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
        <TabsList data-tour="goals-tabs">
          <TabsTrigger value="milestone">Milestone Anak</TabsTrigger>
          <TabsTrigger value="ide">Ide Stimulasi</TabsTrigger>
          <TabsTrigger value="goal">Goal Orang Tua</TabsTrigger>
        </TabsList>

        <TabsContent value="milestone" className="space-y-4">
          {redFlags.length > 0 && (
            <RedFlagNotice flags={redFlags} childName={child.name} />
          )}

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

        <TabsContent value="ide" className="space-y-4">
          <Card className="bg-gradient-to-br from-sage-soft/40 to-background">
            <CardContent className="p-5">
              <p className="flex items-center gap-2 font-display font-bold text-navy">
                <Lightbulb className="h-5 w-5 text-sage" /> Ide stimulasi untuk
                usia ini
              </p>
              <p className="mt-1 text-xs text-navy-muted">
                Aktivitas sederhana di rumah untuk mendukung perkembangan{" "}
                {child.name}. Pilih 1–2 dan lakukan sambil bermain — konsistensi
                lebih penting daripada durasi.
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {activities.map((a) => {
              const meta = domainMeta[a.domain];
              const added = habits.some(
                (h) => h.name === a.title && h.childId === activeId,
              );
              return (
                <Card key={a.title}>
                  <CardContent className="p-4">
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
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                          {a.domain}
                        </p>
                        <p className="text-sm font-semibold text-navy">
                          {a.title}
                        </p>
                        <p className="mt-0.5 text-xs text-navy-muted">
                          {a.detail}
                        </p>
                      </div>
                    </div>
                    <button
                      disabled={added}
                      onClick={() => {
                        const title = a.title;
                        const cId = activeId;
                        addHabit({
                          id: `h-${Date.now()}`,
                          name: title,
                          description: a.detail,
                          category: "Stimulasi Harian",
                          targetPerWeek: 5,
                          streak: 0,
                          history: Array(84).fill(false),
                          childId: cId,
                        });
                        toast.success("Ditambahkan ke Rutinitas! 💪", {
                          description: title,
                          action: {
                            label: "Batalkan",
                            onClick: () => {
                              const found = useAppStore
                                .getState()
                                .habits.find(
                                  (h) =>
                                    h.name === title && h.childId === cId,
                                );
                              if (found) deleteHabit(found.id);
                            },
                          },
                        });
                      }}
                      className={cn(
                        "mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-semibold transition-colors",
                        added
                          ? "cursor-default border-sage/30 bg-sage-soft text-sage"
                          : "border-gold-300 bg-gold-50 text-gold-700 hover:bg-gold-100",
                      )}
                    >
                      {added ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Sudah di Rutinitas
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Tambah ke Rutinitas
                        </>
                      )}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="goal" className="space-y-4">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-gold-100 text-gold-700">
                  <Target className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-display font-bold text-navy">
                    Belum ada goal
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-navy-muted">
                    Buat target yang ingin Anda capai bersama si Kecil, lalu pecah
                    jadi langkah-langkah kecil untuk dipantau.
                  </p>
                </div>
                <GoalDialog
                  trigger={
                    <Button>
                      <Plus /> Buat Goal Pertama
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-end">
                <GoalDialog />
              </div>
              {goals.map((g) => (
                <GoalCard key={g.id} goalId={g.id} />
              ))}
            </>
          )}
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

/** Calm, non-alarming advisory for overdue critical milestones (CDC "act early"). */
function RedFlagNotice({
  flags,
  childName,
}: {
  flags: RedFlag[];
  childName: string;
}) {
  const shown = flags.slice(0, 3);
  const extra = flags.length - shown.length;

  return (
    <Card className="border-soft-orange/40 bg-soft-orange-soft/30">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft-orange-soft text-soft-orange">
            <Info className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-navy">
              Perlu diperhatikan bersama
            </p>
            <p className="mt-0.5 text-xs text-navy-muted">
              Setiap anak tumbuh dengan ritmenya sendiri. Beberapa hal berikut
              untuk {childName} baik <strong>didiskusikan dengan bidan atau
              dokter</strong> pada kunjungan berikutnya. Ini{" "}
              <strong>bukan diagnosis</strong>.
            </p>
            <ul className="mt-3 space-y-2">
              {shown.map((f) => (
                <li
                  key={f.milestone.id}
                  className="rounded-lg border border-soft-orange/30 bg-background px-3 py-2"
                >
                  <p className="text-sm font-semibold text-navy">
                    {f.milestone.title}
                  </p>
                  <p className="text-[11px] text-navy-muted">
                    {f.reason === "regression"
                      ? "Sempat bisa, kini tampak hilang — sebaiknya segera dibahas."
                      : `${f.milestone.domain} • umumnya tercapai sebelum ${f.milestone.ageMaxMonths} bulan`}
                  </p>
                </li>
              ))}
            </ul>
            {extra > 0 && (
              <p className="mt-2 text-[11px] font-medium text-navy-muted">
                dan {extra} hal lain di daftar milestone di bawah.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
          <div className="flex items-center gap-2 font-display font-bold text-navy">
            {label}
            {isCurrent && <Badge variant="gold">Usia anak</Badge>}
          </div>
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
  const setRegressed = useAppStore((s) => s.setMilestoneRegressed);
  const setPhoto = useAppStore((s) => s.setMilestonePhoto);
  const isPremium = useAppStore((s) => s.plan) === "premium";
  const meta = domainMeta[m.domain] ?? fallbackDomainMeta;
  const cycle: MilestoneStatus[] = ["belum", "dicoba", "bisa"];
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function upsellPhoto() {
    toast("Foto momen khusus Premium", {
      description: "Upgrade ke Emas untuk mengabadikan momen milestone.",
      action: { label: "Upgrade", onClick: () => (window.location.href = "/settings") },
    });
  }

  // Upload the moment photo to Cloudinary via /api/upload, then persist on the
  // milestone. Empty url clears it.
  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("purpose", "milestone");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? `Gagal (${res.status})`);
      setPhoto(m.id, data.url!);
      toast.success("Foto momen tersimpan 📸", { description: m.title });
    } catch (err) {
      toast.error("Upload gagal", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

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
            {m.regressed && (
              <Badge variant="warning" className="gap-1">
                <TrendingDown className="h-3 w-3" /> Keterampilan hilang
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-navy-muted">{m.description}</p>
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {m.domain} • usia {m.ageMinMonths}–{m.ageMaxMonths} bulan
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
      {(m.status === "bisa" || m.regressed) && (
        <button
          onClick={() => {
            const next = !m.regressed;
            setRegressed(m.id, next);
            if (next)
              toast("Ditandai: keterampilan yang hilang", {
                description: "Sebaiknya didiskusikan dengan dokter atau bidan.",
              });
          }}
          className="mt-2 text-[11px] font-semibold text-muted-foreground underline-offset-2 transition-colors hover:text-soft-orange hover:underline"
        >
          {m.regressed ? "Tandai sudah pulih" : "Keterampilan ini hilang?"}
        </button>
      )}

      {m.status === "bisa" && (
        <div className="mt-3 border-t pt-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={onPickPhoto}
          />
          {m.photoUrl ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-16 w-16 rounded-lg border">
                <AvatarImage
                  src={m.photoUrl}
                  alt={m.title}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-lg">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  Ganti Foto
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-alert-red hover:bg-alert-red-soft"
                  onClick={() => {
                    setPhoto(m.id, "");
                    toast("Foto momen dihapus");
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Hapus
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => (isPremium ? fileRef.current?.click() : upsellPhoto())}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPremium ? (
                <Camera className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {uploading ? "Mengunggah…" : isPremium ? "Tambah Foto Momen" : "Foto Momen (Premium)"}
            </Button>
          )}
        </div>
      )}
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
