import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  children as childrenT,
  immunizations as immT,
  milestones as msT,
  teeth as teethT,
} from "../src/db/schema/app";
import { childReferenceRows } from "../src/lib/child-templates";

/** Give every existing child the standard milestone/immunization/teeth lists
 *  if they're missing (idempotent). */
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL belum diisi.");
    process.exit(1);
  }
  const kids = await db.select().from(childrenT);
  console.log(`→ ${kids.length} anak ditemukan.`);

  for (const c of kids) {
    const ref = childReferenceRows(c.userId, c.id);
    const [ms, im, th] = await Promise.all([
      db.select({ id: msT.id }).from(msT).where(eq(msT.childId, c.id)),
      db.select({ id: immT.id }).from(immT).where(eq(immT.childId, c.id)),
      db.select({ id: teethT.id }).from(teethT).where(eq(teethT.childId, c.id)),
    ]);
    if (ms.length === 0) await db.insert(msT).values(ref.milestones);
    if (im.length === 0) await db.insert(immT).values(ref.immunizations);
    if (th.length === 0) await db.insert(teethT).values(ref.teeth);
    console.log(
      `  ${c.name}: milestones ${ms.length ? "ok" : "+seed"}, imunisasi ${im.length ? "ok" : "+seed"}, gigi ${th.length ? "ok" : "+seed"}`,
    );
  }
  console.log("✓ Backfill selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
