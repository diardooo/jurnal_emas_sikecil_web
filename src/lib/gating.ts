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
