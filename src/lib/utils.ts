import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indonesian Rupiah. */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Compute a child's age from a date-of-birth string (ISO). */
export function getAge(dob: string): { months: number; days: number; label: string } {
  const birth = new Date(dob);
  const now = new Date();
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  let label = "";
  if (years > 0) label += `${years} tahun `;
  if (remMonths > 0) label += `${remMonths} bulan `;
  if (years === 0) label += `${days} hari`;
  return { months, days, label: label.trim() };
}

/** Whole months between dob and a measurement date (ISO strings). */
export function ageInMonthsAt(dob: string, date: string): number {
  const b = new Date(dob);
  const d = new Date(date);
  let months =
    (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth());
  if (d.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Indonesian short date, e.g. "19 Jun 2026". */
export function formatDateID(date: string | Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Relative deadline label + urgency tone, anchored to the app's demo "today". */
export function deadlineInfo(
  dueDate?: string,
  done = false,
): { label: string; tone: "overdue" | "soon" | "upcoming" | "none" } | null {
  if (!dueDate) return null;
  // Demo "today" matches the seeded data (currentDate 2026-06-19).
  const today = new Date("2026-06-19T00:00:00");
  const due = new Date(dueDate + "T00:00:00");
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (done) return { label: `Tenggat ${formatDateID(dueDate)}`, tone: "none" };
  if (days < 0)
    return { label: `Terlambat ${Math.abs(days)} hari`, tone: "overdue" };
  if (days === 0) return { label: "Jatuh tempo hari ini", tone: "soon" };
  if (days === 1) return { label: "Besok", tone: "soon" };
  if (days <= 3) return { label: `${days} hari lagi`, tone: "soon" };
  return { label: formatDateID(dueDate), tone: "upcoming" };
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
