import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { children as childrenT, milestones as msT } from "../src/db/schema/app";
import { refMilestones } from "../src/db/schema/admin";
import { mockMilestones } from "../src/lib/mock-data";

/**
 * Rekonsiliasi milestone ke katalog kanonik (`mockMilestones`, 53 item incl. CDC).
 * Idempotent & aman:
 *  1) Refresh `ref_milestones` dari satu sumber (untuk anak yang dibuat ke depan).
 *  2) Tiap anak: tambahkan milestone kanonik yang BELUM dimiliki (match by `title`,
 *     status "belum").
 *  3) Buang "orphan" (judul di luar katalog kanonik — sisa ref lama domain "Bahasa")
 *     HANYA jika statusnya masih "belum" (placeholder yg belum disentuh orang tua),
 *     sehingga tanda progres yang sudah ada tidak terhapus.
 *
 * Jalankan: `npm run db:cdc` (atau dgn DATABASE_URL produksi untuk merapikan prod).
 */

const canonical = mockMilestones;
const canonicalTitles = new Set(canonical.map((m) => m.title));

const refRows = () =>
  canonical.map((m) => ({
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

  const rows = refRows();
  await db.delete(refMilestones);
  await db.insert(refMilestones).values(rows);
  console.log(`→ ref_milestones di-refresh: ${rows.length} item kanonik.`);

  const kids = await db.select().from(childrenT);
  console.log(`→ ${kids.length} anak ditemukan.`);

  let added = 0;
  let removed = 0;
  for (const c of kids) {
    const existing = await db
      .select({ id: msT.id, title: msT.title, status: msT.status })
      .from(msT)
      .where(eq(msT.childId, c.id));
    const have = new Set(existing.map((r) => r.title));

    // 1) tambah kanonik yang kurang
    const toAdd = canonical.filter((m) => !have.has(m.title));
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
      added += toAdd.length;
    }

    // 2) buang orphan yg belum disentuh (judul di luar katalog & status "belum")
    const orphanIds = existing
      .filter((r) => !canonicalTitles.has(r.title) && r.status === "belum")
      .map((r) => r.id);
    if (orphanIds.length > 0) {
      await db.delete(msT).where(inArray(msT.id, orphanIds));
      removed += orphanIds.length;
    }

    console.log(`  ${c.name}: +${toAdd.length} / -${orphanIds.length}`);
  }
  console.log(`✓ Selesai. Total +${added} disisipkan, -${removed} orphan dihapus.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
