import { evaluateRedFlags } from "./red-flags";
import { getAge } from "./utils";
import type { Milestone } from "./types";

/** A derived reminder row ready to upsert into the notifications table. */
export interface GenRow {
  /** Deterministic id (`auto:<kind>:…`) → idempotent upsert, never duplicates. */
  id: string;
  type: string;
  title: string;
  body: string;
  date: string;
}

export interface ReminderInput {
  children: { id: string; name: string; dob: string }[];
  immunizations: {
    id: string;
    childId: string | null;
    vaccine: string;
    ageLabel: string;
    ageMonths: number;
    status: string;
  }[];
  milestones: Milestone[];
  tasks: { id: string; title: string; status: string; dueDate: string | null }[];
  /** Today as YYYY-MM-DD; used for the row date and task-deadline math. */
  today: string;
}

/** Whole days from `today` until `iso` (negative = past). */
function daysUntil(iso: string, today: string): number {
  const MS = 86_400_000;
  return Math.round((new Date(iso).getTime() - new Date(today).getTime()) / MS);
}

/**
 * Pure reminder builder — derives notification rows from a user's data.
 * Kept side-effect free so it's unit-testable; the route does the DB I/O.
 *
 * Sources: immunizations due by age, milestone red-flags (CDC screening),
 * and tasks due within 3 days.
 */
export function buildReminders(input: ReminderInput): GenRow[] {
  const { children, immunizations, milestones, tasks, today } = input;
  const rows: GenRow[] = [];

  for (const c of children) {
    const ageMonths = getAge(c.dob).months;

    for (const im of immunizations) {
      if (im.childId !== c.id) continue;
      if (im.status !== "selesai" && ageMonths >= im.ageMonths) {
        rows.push({
          id: `auto:imun:${c.id}:${im.id}`,
          type: "imunisasi",
          title: `Imunisasi ${im.vaccine} untuk ${c.name}`,
          body: `Jadwal usia ${im.ageLabel} sudah tiba. Lengkapi di tracker imunisasi.`,
          date: today,
        });
      }
    }

    const childMiles = milestones.filter((m) => m.childId === c.id);
    for (const flag of evaluateRedFlags(ageMonths, childMiles)) {
      rows.push({
        id: `auto:redflag:${c.id}:${flag.milestone.id}`,
        type: "milestone",
        title: `Perhatikan perkembangan ${c.name}`,
        body:
          flag.reason === "regression"
            ? `Keterampilan "${flag.milestone.title}" tampak hilang. Sebaiknya didiskusikan dengan dokter atau bidan.`
            : `"${flag.milestone.title}" belum tercapai di rentang usianya. Sebaiknya didiskusikan dengan dokter atau bidan.`,
        date: today,
      });
    }
  }

  for (const t of tasks) {
    if (t.status === "done" || !t.dueDate) continue;
    const days = daysUntil(t.dueDate, today);
    if (days < 0 || days > 3) continue;
    rows.push({
      id: `auto:task:${t.id}`,
      type: "task",
      title: `Tenggat: ${t.title}`,
      body: days === 0 ? "Jatuh tempo hari ini." : `Jatuh tempo dalam ${days} hari.`,
      date: today,
    });
  }

  return rows;
}
