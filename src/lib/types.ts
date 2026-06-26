export type Gender = "L" | "P";

export interface Child {
  id: string;
  name: string;
  dob: string; // ISO date
  gender: Gender;
  photoUrl?: string;
  birthWeight?: number; // kg
  birthHeight?: number; // cm
  color: string; // accent color for UI
}

export type Priority = "tinggi" | "sedang" | "rendah";
/** Suggested categories; users may also enter custom ones, so this is a string. */
export type TaskCategory = string;
export type TaskStatus = "todo" | "progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: TaskCategory;
  dueDate?: string;
  status: TaskStatus;
  childId?: string;
  isRecurring?: boolean;
}

export type TodoCategory = "Rutinitas Pagi" | "Siang" | "Malam" | "Jadwal Anak";

export interface TodoItem {
  id: string;
  title: string;
  category: TodoCategory;
  done: boolean;
  childId?: string;
}

/** Suggested categories; users may add custom ones, so this is a string. */
export type HabitCategory = string;

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  targetPerWeek: number;
  streak: number;
  reminderTime?: string;
  /** last 84 days, true = completed */
  history: boolean[];
  childId?: string;
}

/** Canonical milestone domains — single source of truth (runtime + type).
 *  The goals page maps each to an icon/color via `domainMeta`, so any value
 *  stored in the DB MUST be one of these or the page can't render it. */
export const MILESTONE_DOMAINS = [
  "Motorik Kasar",
  "Motorik Halus",
  "Kognitif",
  "Bahasa & Komunikasi",
  "Sosial-Emosional",
  "Sensorik",
  "Nutrisi & Pertumbuhan",
] as const;

export type MilestoneDomain = (typeof MILESTONE_DOMAINS)[number];

export type MilestoneStatus = "belum" | "dicoba" | "bisa";

export interface Milestone {
  id: string;
  childId?: string;
  title: string;
  description: string;
  domain: MilestoneDomain;
  ageMinMonths: number;
  ageMaxMonths: number;
  isCritical: boolean;
  status: MilestoneStatus;
  /** True when a previously-acquired skill is lost again (regression red flag). */
  regressed?: boolean;
  achievedAt?: string;
  note?: string;
  hasPhoto?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  domain: string;
  progress: number; // 0-100
  targetDate?: string;
  subGoals: { id: string; title: string; done: boolean }[];
}

export interface GrowthRecord {
  id?: string;
  childId?: string;
  ageMonths: number;
  weight: number; // kg
  height: number; // cm
  headCirc?: number; // cm — lingkar kepala
  date?: string; // ISO, when measured
  note?: string;
}

export type ImmunizationStatus = "selesai" | "dijadwalkan" | "akan-datang";

export interface Immunization {
  id: string;
  childId?: string;
  vaccine: string;
  ageLabel: string; // e.g. "2 bulan"
  ageMonths: number;
  status: ImmunizationStatus;
  date?: string; // given/scheduled date
}

export interface ToothRecord {
  id: string;
  childId?: string;
  name: string; // e.g. "Gigi seri tengah bawah"
  typicalAgeLabel: string; // e.g. "6–10 bln"
  erupted: boolean;
  date?: string;
}

export interface SleepLog {
  id: string;
  date: string; // ISO date
  nightHours: number;
  napHours: number;
  childId?: string;
}

/** Phase grouping for milestones (per Indonesia KPSP/IDAI checkpoints). */
export type AgePhaseId =
  | "0-3"
  | "3-6"
  | "6-9"
  | "9-12"
  | "12-18"
  | "18-24"
  | "24-36"
  | "36-48"
  | "48-60"
  | "60-72";

/** Mood of the child captured for a journal entry (optional). */
export type JournalMood = "senang" | "biasa" | "rewel" | "sakit" | "bangga";

export interface JournalEntry {
  id: string;
  childId?: string;
  date: string; // ISO date
  mood?: JournalMood;
  title?: string;
  body: string;
  tags: string[];
  /** Media URLs (photos/voice) — schema-ready; upload UI is a later milestone. */
  media: string[];
  createdAt?: string;
}

export interface AppNotification {
  id: string;
  type: "imunisasi" | "posyandu" | "task" | "habit" | "milestone";
  title: string;
  body: string;
  date: string;
  read: boolean;
}

export type SubscriptionPlan = "free" | "premium";
