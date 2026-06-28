import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, growthRecords, immunizations, milestones, reportShares } from "@/db/schema/app";

export const runtime = "nodejs";

/**
 * PUBLIC (no auth): resolve a report share token to a child's read-only report.
 * Returns 404 for unknown tokens and 410 once expired. Exposes only the data a
 * shared developmental report needs — no account/contact info.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  const [share] = await db
    .select()
    .from(reportShares)
    .where(eq(reportShares.id, token))
    .limit(1);
  if (!share) return NextResponse.json({ error: "Link laporan tidak ditemukan" }, { status: 404 });
  if (share.expiresAt && share.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Link laporan sudah kedaluwarsa" }, { status: 410 });
  }

  const [child] = await db
    .select({ name: children.name, dob: children.dob, gender: children.gender })
    .from(children)
    .where(eq(children.id, share.childId))
    .limit(1);
  if (!child) return NextResponse.json({ error: "Data anak tidak ditemukan" }, { status: 404 });

  const [growth, miles, immun] = await Promise.all([
    db.select().from(growthRecords).where(eq(growthRecords.childId, share.childId)).orderBy(asc(growthRecords.ageMonths)),
    db.select().from(milestones).where(eq(milestones.childId, share.childId)),
    db.select().from(immunizations).where(eq(immunizations.childId, share.childId)),
  ]);

  return NextResponse.json({
    child,
    range: { from: share.fromDate, to: share.toDate },
    expiresAt: share.expiresAt,
    growth: growth.map((g) => ({
      date: g.date,
      ageMonths: g.ageMonths,
      weight: g.weight,
      height: g.height,
      headCirc: g.headCirc,
    })),
    milestones: {
      achieved: miles.filter((m) => m.status === "bisa").map((m) => ({ title: m.title, domain: m.domain })),
      total: miles.length,
    },
    immunizations: {
      done: immun.filter((i) => i.status === "selesai").length,
      total: immun.length,
    },
  });
}
