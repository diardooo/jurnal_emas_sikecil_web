import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { children, milestones } from "@/db/schema/app";
import { getUser, resource, unauthorized } from "@/lib/api";
import { milestoneTemplate } from "@/lib/child-templates";

const r = resource(milestones);
export const POST = r.POST;

const keyOf = (m: { title: string; ageMinMonths: number }) =>
  `${m.title}|${m.ageMinMonths}`;

/**
 * GET /api/milestones?childId=xxx (childId optional)
 *
 * Returns the user's milestones. The milestone template grows over time (new
 * developmental items added); children created before an expansion are missing
 * those rows. On read we detect, per child, which template entries are absent
 * (matched by title + ageMinMonths) and insert them with status "belum" — so
 * existing users automatically receive new milestones with no manual migration.
 * Backfill runs whether or not childId is passed (hydrate() omits it).
 */
export async function GET(req: NextRequest) {
  const userInfo = await getUser(req);
  if (!userInfo) return unauthorized();

  const childId = req.nextUrl.searchParams.get("childId");

  const load = () => {
    const filters = [eq(milestones.userId, userInfo.id)];
    if (childId) filters.push(eq(milestones.childId, childId));
    return db
      .select()
      .from(milestones)
      .where(and(...filters))
      .orderBy(asc(milestones.createdAt));
  };

  let rows = await load();

  // Which children to consider: the requested one, or all the user's children.
  const childIds = childId
    ? [childId]
    : (
        await db
          .select({ id: children.id })
          .from(children)
          .where(eq(children.userId, userInfo.id))
      ).map((c) => c.id);

  // Per child, insert any template entries that aren't present yet.
  const inserts: Array<Record<string, unknown>> = [];
  for (const cid of childIds) {
    const have = new Set(rows.filter((m) => m.childId === cid).map(keyOf));
    for (const t of milestoneTemplate) {
      if (!have.has(keyOf(t))) {
        inserts.push({ ...t, userId: userInfo.id, childId: cid });
      }
    }
  }

  if (inserts.length > 0) {
    await db.insert(milestones).values(inserts as never);
    rows = await load(); // re-read so the response includes the new rows
  }

  return NextResponse.json(rows);
}
