import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { milestones } from "@/db/schema/app";
import { getUser, resource, unauthorized } from "@/lib/api";
import { milestoneTemplate } from "@/lib/child-templates";

const r = resource(milestones);
export const POST = r.POST;

/**
 * GET /api/milestones?childId=xxx
 *
 * Returns all milestones for the child.  If the stored set is smaller than the
 * current milestoneTemplate (e.g. the template was expanded after the child was
 * created), the missing rows are inserted on first read with status "belum" so
 * existing users automatically receive the new milestone content.
 */
export async function GET(req: NextRequest) {
  const userInfo = await getUser(req);
  if (!userInfo) return unauthorized();

  const childId = req.nextUrl.searchParams.get("childId");
  const filters = [eq(milestones.userId, userInfo.id)];
  if (childId) filters.push(eq(milestones.childId, childId));

  const rows = await db
    .select()
    .from(milestones)
    .where(and(...filters))
    .orderBy(asc(milestones.createdAt));

  // Backfill: find template entries missing from the DB (matched by title + ageMinMonths).
  if (childId) {
    const existingKeys = new Set(
      rows.map((r) => `${r.title}|${r.ageMinMonths}`),
    );
    const missing = milestoneTemplate.filter(
      (t) => !existingKeys.has(`${t.title}|${t.ageMinMonths}`),
    );
    if (missing.length > 0) {
      const inserted = await db
        .insert(milestones)
        .values(
          missing.map((m) => ({ ...m, userId: userInfo.id, childId })),
        )
        .returning();
      // Return existing + newly inserted, sorted by ageMinMonths for consistency.
      const all = [...rows, ...inserted].sort(
        (a, b) => a.ageMinMonths - b.ageMinMonths,
      );
      return NextResponse.json(all);
    }
  }

  return NextResponse.json(rows);
}
