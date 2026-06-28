/**
 * Premium gating limits — shared by server (enforcement) and client (UX/upsell).
 * Keep this free of server-only imports so client components can use it too.
 */
export const FREE_CHILD_LIMIT = 1; // Free: 1 child; Premium: unlimited
export const FREE_COACH_DAILY_LIMIT = 3; // Free: 3 AI Coach Q/day; Premium: COACH_DAILY_LIMIT

/** Features locked to Premium (for upsell copy). */
export const PREMIUM_FEATURES = [
  "Upload foto (jurnal, milestone, profil)",
  "Tambah anak tanpa batas",
  "Pendamping AI penuh (kuota harian besar)",
  "Export & bagikan laporan PDF",
] as const;

/**
 * The actual Free vs Premium access policy ENFORCED by the code (see the gates
 * in /api/upload, /api/children, /api/coach, reports). This is the single source
 * of truth the admin dashboard displays — so the matrix can never drift from
 * reality. `free`/`premium` = can access at all; `note` carries quota/limit
 * nuances that a boolean can't express.
 */
export const ACCESS_POLICY: {
  feature: string;
  free: boolean;
  premium: boolean;
  note?: string;
}[] = [
  { feature: "Dashboard & ringkasan", free: true, premium: true },
  { feature: "Profil anak", free: true, premium: true, note: `Free maks ${FREE_CHILD_LIMIT} • Premium tak terbatas` },
  { feature: "Goal & Milestone (+ deteksi red flag)", free: true, premium: true },
  { feature: "Task Manager", free: true, premium: true },
  { feature: "Rutinitas (to-do + habit)", free: true, premium: true },
  { feature: "Tumbuh Kembang — z-score WHO", free: true, premium: true },
  { feature: "Imunisasi / Gigi / Tidur tracker", free: true, premium: true },
  { feature: "Jurnal Emas (catatan)", free: true, premium: true },
  { feature: "Pengingat & notifikasi", free: true, premium: true },
  { feature: "Pendamping AI (Pendamping Emas)", free: true, premium: true, note: `Free ${FREE_COACH_DAILY_LIMIT}/hari • Premium kuota penuh` },
  // Premium-only:
  { feature: "Lebih dari 1 profil anak", free: false, premium: true },
  { feature: "Foto di Jurnal & Milestone", free: false, premium: true },
  { feature: "Export PDF & bagikan laporan via link", free: false, premium: true },
];
