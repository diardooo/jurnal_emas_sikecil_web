import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { auth } from "../src/lib/auth";
import { user as userT } from "../src/db/schema/auth";
import {
  discountCodes,
  platformSettings,
  refImmunizations,
  refMilestones,
  refSleep,
  refTeeth,
  rolePermissions,
} from "../src/db/schema/admin";
import { mockMilestones } from "../src/lib/mock-data";

const ADMIN = {
  name: "Diardo",
  email: "admin@jurnalemas.com",
  password: "admin12345",
};

const ROLE_MATRIX = [
  ["Dashboard & Ringkasan", true, true],
  ["Profil Anak (maks 1)", true, true],
  ["Goal & Milestone Tracker", true, true],
  ["Task Manager", true, true],
  ["Rutinitas (To-Do + Habit)", true, true],
  ["Tumbuh Kembang — Grafik WHO", true, true],
  ["Imunisasi Tracker", false, true],
  ["Gigi Susu Tracker", false, true],
  ["Jadwal Tidur Tracker", false, true],
  ["Pengingat & Notifikasi Pintar", false, true],
  ["Lebih dari 1 Profil Anak", false, true],
  ["Export Laporan PDF", false, true],
  ["Riwayat Data Tanpa Batas", false, true],
  ["Tema & Kustomisasi", false, true],
  ["Prioritas Dukungan (Support)", false, true],
] as const;

const DISCOUNTS = [
  { code: "EMASBARU", type: "percent", value: 30, description: "Diskon user baru", maxUsage: 500, usedCount: 128, expiresAt: "2026-12-31", active: true },
  { code: "TAHUNAN50", type: "percent", value: 50, description: "Promo upgrade tahunan", maxUsage: 200, usedCount: 64, expiresAt: "2026-06-30", active: true },
  { code: "RAMADAN25", type: "percent", value: 25, description: "Promo Ramadan", maxUsage: 210, usedCount: 210, expiresAt: "2026-04-10", active: false },
  { code: "POTONG20K", type: "fixed", value: 20000, description: "Potongan flat Rp20rb", maxUsage: 300, usedCount: 47, expiresAt: "2026-07-31", active: true },
];

const IMUNISASI = [
  { vaccine: "Hepatitis B (HB-0)", ageLabel: "0 bln (< 24 jam)", ageMonths: 0, doses: "1 dosis", mandatory: true, note: "Diberikan segera setelah lahir" },
  { vaccine: "BCG", ageLabel: "1 bln", ageMonths: 1, doses: "1 dosis", mandatory: true, note: "Optimal sebelum 3 bln" },
  { vaccine: "Polio (OPV/IPV)", ageLabel: "1, 2, 3, 4 bln", ageMonths: 1, doses: "4 dosis", mandatory: true, note: "OPV-0 saat lahir" },
  { vaccine: "DPT-HB-Hib", ageLabel: "2, 3, 4 bln", ageMonths: 2, doses: "3 dosis", mandatory: true, note: "Difteri, Pertusis, Tetanus, Hib, Hep B" },
  { vaccine: "PCV (Pneumokokus)", ageLabel: "2, 4, 6 bln", ageMonths: 2, doses: "3 + booster", mandatory: true, note: "Booster usia 12–15 bln" },
  { vaccine: "Rotavirus", ageLabel: "2, 4, 6 bln", ageMonths: 2, doses: "2–3 dosis", mandatory: false, note: "Tergantung merek vaksin" },
  { vaccine: "Influenza", ageLabel: "≥ 6 bln", ageMonths: 6, doses: "Tahunan", mandatory: false, note: "Diulang setiap tahun" },
  { vaccine: "Campak/MR (1)", ageLabel: "9 bln", ageMonths: 9, doses: "1 dosis", mandatory: true, note: "Measles-Rubella" },
  { vaccine: "MMR", ageLabel: "15 bln", ageMonths: 15, doses: "1 dosis", mandatory: false, note: "Measles-Mumps-Rubella" },
  { vaccine: "Campak/MR (2)", ageLabel: "18 bln", ageMonths: 18, doses: "Booster", mandatory: true, note: "Dosis penguat" },
  { vaccine: "Hepatitis A", ageLabel: "12–24 bln", ageMonths: 12, doses: "2 dosis", mandatory: false, note: "Interval 6–12 bln" },
  { vaccine: "Varisela", ageLabel: "12–18 bln", ageMonths: 12, doses: "1–2 dosis", mandatory: false, note: "Cacar air" },
];

const TEETH = [
  { name: "Gigi seri tengah bawah", position: "Rahang bawah", eruptAgeLabel: "6–10 bln", sheddAgeLabel: "6–7 thn", count: 2 },
  { name: "Gigi seri tengah atas", position: "Rahang atas", eruptAgeLabel: "8–12 bln", sheddAgeLabel: "6–7 thn", count: 2 },
  { name: "Gigi seri samping atas", position: "Rahang atas", eruptAgeLabel: "9–13 bln", sheddAgeLabel: "7–8 thn", count: 2 },
  { name: "Gigi seri samping bawah", position: "Rahang bawah", eruptAgeLabel: "10–16 bln", sheddAgeLabel: "7–8 thn", count: 2 },
  { name: "Geraham pertama atas", position: "Rahang atas", eruptAgeLabel: "13–19 bln", sheddAgeLabel: "9–11 thn", count: 2 },
  { name: "Geraham pertama bawah", position: "Rahang bawah", eruptAgeLabel: "14–18 bln", sheddAgeLabel: "9–11 thn", count: 2 },
  { name: "Gigi taring atas", position: "Rahang atas", eruptAgeLabel: "16–22 bln", sheddAgeLabel: "10–12 thn", count: 2 },
  { name: "Gigi taring bawah", position: "Rahang bawah", eruptAgeLabel: "17–23 bln", sheddAgeLabel: "9–12 thn", count: 2 },
  { name: "Geraham kedua bawah", position: "Rahang bawah", eruptAgeLabel: "23–31 bln", sheddAgeLabel: "10–12 thn", count: 2 },
  { name: "Geraham kedua atas", position: "Rahang atas", eruptAgeLabel: "25–33 bln", sheddAgeLabel: "10–12 thn", count: 2 },
];

const SLEEP = [
  { groupName: "Bayi baru lahir", ageLabel: "0–3 bln", totalLabel: "14–17 jam", nightLabel: "8–9 jam", napLabel: "7–9 jam (3–5x)", note: "Belum ada pola siang-malam teratur" },
  { groupName: "Bayi", ageLabel: "4–11 bln", totalLabel: "12–15 jam", nightLabel: "9–10 jam", napLabel: "3–4 jam (2–3x)", note: "Mulai terbentuk pola tidur malam" },
  { groupName: "Batita", ageLabel: "1–2 thn", totalLabel: "11–14 jam", nightLabel: "10–11 jam", napLabel: "1,5–3 jam (1–2x)", note: "Transisi ke 1x tidur siang" },
  { groupName: "Prasekolah", ageLabel: "3–5 thn", totalLabel: "10–13 jam", nightLabel: "10–11 jam", napLabel: "0–1 jam", note: "Sebagian anak berhenti tidur siang" },
  { groupName: "Usia sekolah", ageLabel: "6 thn+", totalLabel: "9–12 jam", nightLabel: "9–11 jam", napLabel: "Tidak rutin", note: "Tidur malam sumber utama istirahat" },
];

/**
 * Katalog `ref_milestones` diturunkan dari SATU sumber kebenaran `mockMilestones`
 * (50 item 0–6 th + tambahan skrining CDC = 53), domain kanonik (`MILESTONE_DOMAINS`)
 * dan ber-`description`. Dulu di sini ada list 6-item terpisah dgn domain non-kanonik
 * ("Bahasa") — itu menyebabkan divergensi data; sekarang disatukan.
 */
const MILESTONES = mockMilestones.map((m) => ({
  domain: m.domain,
  title: m.title,
  description: m.description,
  ageMinMonths: m.ageMinMonths,
  ageMaxMonths: m.ageMaxMonths,
  isCritical: m.isCritical,
  reference: "WHO / IDAI (KPSP) / Denver II / CDC",
}));

const SETTINGS: Record<string, string> = {
  platform_name: "Jurnal Emas Si Kecil",
  platform_url: "https://jurnalemas.com",
  support_email: "support@jurnalemas.com",
  admin_whatsapp: "081234567800",
  price_monthly: "49000",
  price_yearly: "399000",
  trial_days: "14",
  trial_enabled: "true",
};

async function ensureAdmin(): Promise<string> {
  let userId: string;
  try {
    const res = await auth.api.signUpEmail({
      body: { name: ADMIN.name, email: ADMIN.email, password: ADMIN.password },
    });
    userId = res.user.id;
  } catch {
    const [u] = await db.select({ id: userT.id }).from(userT).where(eq(userT.email, ADMIN.email)).limit(1);
    if (!u) throw new Error("Gagal membuat / menemukan akun admin");
    userId = u.id;
  }
  await db
    .update(userT)
    .set({ role: "superadmin", status: "active", phone: SETTINGS.admin_whatsapp })
    .where(eq(userT.id, userId));
  return userId;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL belum diisi di .env — seed dibatalkan.");
    process.exit(1);
  }

  console.log("→ Menyiapkan akun Super Admin…");
  await ensureAdmin();

  console.log("→ Reset & seed matriks role…");
  await db.delete(rolePermissions);
  await db.insert(rolePermissions).values(
    ROLE_MATRIX.map(([feature, free, premium], i) => ({
      feature, sortOrder: i, freeEnabled: free, premiumEnabled: premium,
    })),
  );

  console.log("→ Seed kode diskon…");
  await db.delete(discountCodes);
  await db.insert(discountCodes).values(DISCOUNTS);

  console.log("→ Seed konten referensi (milestone, imunisasi, gigi, tidur)…");
  await db.delete(refMilestones);
  await db.insert(refMilestones).values(MILESTONES);
  await db.delete(refImmunizations);
  await db.insert(refImmunizations).values(IMUNISASI);
  await db.delete(refTeeth);
  await db.insert(refTeeth).values(TEETH);
  await db.delete(refSleep);
  await db.insert(refSleep).values(SLEEP);

  console.log("→ Seed pengaturan platform…");
  for (const [key, value] of Object.entries(SETTINGS)) {
    await db
      .insert(platformSettings)
      .values({ key, value })
      .onConflictDoUpdate({ target: platformSettings.key, set: { value } });
  }

  console.log("\n✓ Seed admin selesai!");
  console.log(`  Login admin: ${ADMIN.email} / ${ADMIN.password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
