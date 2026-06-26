import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { children as childrenT, milestones as msT } from "../src/db/schema/app";
import { refMilestones } from "../src/db/schema/admin";
import { mockMilestones } from "../src/lib/mock-data";

/**
 * M4b backfill (idempotent & additive):
 *  1) Refresh katalog `ref_milestones` dari SATU sumber (`mockMilestones`,
 *     domain kanonik + description) — merapikan divergensi list lama.
 *  2) Sisipkan milestone skrining CDC baru ke setiap anak yang belum punya
 *     (dicocokkan by `title`), status "belum". Baris milestone lain tidak disentuh.
 *
 * Aman dijalankan ulang: anak yg sudah punya → +0.
 * Jalankan: `npm run db:cdc` (atau `tsx scripts/add-cdc-milestones.ts`).
 */

const NEW_TITLES = [
  "Menoleh saat dipanggil nama",
  "Menunjuk untuk berbagi perhatian",
  "Mengikuti perintah 2 langkah",
];

const refRows = () =>
  mockMilestones.map((m) => ({
    domain: m.domain,
    title: m.title,
    description: m.description,
    ageMinMonths: m.ageMinMonths,
    ageMaxMonths: m.ageMaxMonths,
    isCritical: m.isCritical,
    reference: "WHO / IDAI (KPSP) / Denver II / CDC",
  }));

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL belum diisi.");
    process.exit(1);
  }

  // 1) Refresh katalog referensi (kanonik) untuk anak yang dibuat ke depan.
  const rows = refRows();
  await db.delete(refMilestones);
  await db.insert(refMilestones).values(rows);
  console.log(`→ ref_milestones di-refresh: ${rows.length} item kanonik.`);

  // 2) Backfill milestone CDC baru ke anak existing (idempotent by title).
  const newMs = mockMilestones.filter((m) => NEW_TITLES.includes(m.title));
  const kids = await db.select().from(childrenT);
  console.log(`→ ${kids.length} anak ditemukan.`);

  let inserted = 0;
  for (const c of kids) {
    const existing = await db
      .select({ title: msT.title })
      .from(msT)
      .where(eq(msT.childId, c.id));
    const have = new Set(existing.map((r) => r.title));
    const toAdd = newMs.filter((m) => !have.has(m.title));
    if (toAdd.length > 0) {
      await db.insert(msT).values(
        toAdd.map((m) => ({
          userId: c.userId,
          childId: c.id,
          title: m.title,
          description: m.description,
          domain: m.domain,
          ageMinMonths: m.ageMinMonths,
          ageMaxMonths: m.ageMaxMonths,
          isCritical: m.isCritical,
          status: "belum" as const,
        })),
      );
      inserted += toAdd.length;
    }
    console.log(`  ${c.name}: +${toAdd.length} milestone CDC`);
  }
  console.log(`✓ Selesai. Total ${inserted} milestone disisipkan.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
