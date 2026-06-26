import type { JournalEntry, JournalMood } from "./types";

/** Display metadata for each journal mood (shared by the dialog and timeline). */
export const MOOD_META: Record<
  JournalMood,
  { emoji: string; label: string; cls: string }
> = {
  senang: { emoji: "😊", label: "Senang", cls: "bg-sage-soft text-sage" },
  biasa: { emoji: "🙂", label: "Biasa", cls: "bg-muted text-muted-foreground" },
  rewel: { emoji: "😣", label: "Rewel", cls: "bg-soft-orange-soft text-soft-orange" },
  sakit: { emoji: "🤒", label: "Sakit", cls: "bg-alert-red-soft text-alert-red" },
  bangga: { emoji: "🌟", label: "Bangga", cls: "bg-gold-100 text-gold-700" },
};

export const MOODS = Object.keys(MOOD_META) as JournalMood[];

/** Quick-pick tags offered in the journal entry dialog. */
export const SUGGESTED_TAGS = [
  "Milestone",
  "Makan",
  "Tidur",
  "Main",
  "Belajar",
  "Sakit",
  "Jalan-jalan",
  "Lucu",
];

export interface ResurfacedMemory {
  entry: JournalEntry;
  label: string;
}

/**
 * Pick a memory to resurface in the daily ritual: prefer an entry from ~1 year
 * ago (±3 days) for an "on this day" moment; otherwise fall back to the most
 * recent entry. `entries` are expected newest-first (as stored). Returns null
 * when there are no entries yet.
 */
export function resurfaceMemory(
  entries: JournalEntry[],
  today: Date = new Date(),
): ResurfacedMemory | null {
  if (entries.length === 0) return null;
  const yearAgo = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);
  const THREE_DAYS = 3 * 86_400_000;
  const anniversary = entries.find(
    (e) => Math.abs(new Date(e.date).getTime() - yearAgo.getTime()) <= THREE_DAYS,
  );
  if (anniversary) return { entry: anniversary, label: "Setahun lalu" };
  return { entry: entries[0], label: "Kenangan terakhir" };
}
