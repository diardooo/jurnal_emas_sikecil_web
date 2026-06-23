import { NextRequest, NextResponse } from "next/server";
import { count, countDistinct, eq, gt, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { session, user } from "@/db/schema/auth";
import { children, milestones, subscriptions, tasks } from "@/db/schema/app";
import {
  platformSettings,
  refImmunizations,
  refMilestones,
  refSleep,
  refTeeth,
} from "@/db/schema/admin";
import { forbidden, getAdmin } from "@/lib/admin";

/** Aggregate counters for the Overview / Analytics dashboards. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();

  const now = new Date();
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const dayAgo = new Date(Date.now() - 864e5);

  const [
    [{ totalUsers }],
    [{ suspended }],
    [{ premium }],
    [{ totalChildren }],
    [{ newThisWeek }],
    [{ milestonesAchieved }],
    [{ tasksDone }],
    [{ activeNow }],
    [{ active24h }],
    [{ active7d }],
    planRows,
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(user),
    db.select({ suspended: count() }).from(user).where(eq(user.status, "suspended")),
    db.select({ premium: count() }).from(subscriptions).where(eq(subscriptions.plan, "premium")),
    db.select({ totalChildren: count() }).from(children),
    db.select({ newThisWeek: count() }).from(user).where(gte(user.createdAt, weekAgo)),
    db.select({ milestonesAchieved: count() }).from(milestones).where(eq(milestones.status, "bisa")),
    db.select({ tasksDone: count() }).from(tasks).where(eq(tasks.status, "done")),
    // "User aktif" = distinct users with a live (non-expired) session.
    db.select({ activeNow: countDistinct(session.userId) }).from(session).where(gt(session.expiresAt, now)),
    db.select({ active24h: countDistinct(session.userId) }).from(session).where(gte(session.updatedAt, dayAgo)),
    db.select({ active7d: countDistinct(session.userId) }).from(session).where(gte(session.updatedAt, weekAgo)),
    db.select({ plan: subscriptions.plan, n: count() }).from(subscriptions).groupBy(subscriptions.plan),
  ]);

  // User growth by month (last 12 months).
  const growth = await db
    .select({
      month: sql<string>`to_char(${user.createdAt}, 'YYYY-MM')`,
      n: count(),
    })
    .from(user)
    .groupBy(sql`to_char(${user.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${user.createdAt}, 'YYYY-MM')`);

  // Content catalog counts + estimated MRR (premium × monthly price setting).
  const [refM, refI, refT, refS, priceRow] = await Promise.all([
    db.select({ n: count() }).from(refMilestones),
    db.select({ n: count() }).from(refImmunizations),
    db.select({ n: count() }).from(refTeeth),
    db.select({ n: count() }).from(refSleep),
    db.select().from(platformSettings).where(inArray(platformSettings.key, ["price_monthly"])),
  ]);
  const priceMonthly = Number(priceRow.find((p) => p.key === "price_monthly")?.value ?? 49000) || 49000;

  return NextResponse.json({
    totalUsers: Number(totalUsers),
    suspended: Number(suspended),
    premium: Number(premium),
    totalChildren: Number(totalChildren),
    newThisWeek: Number(newThisWeek),
    milestonesAchieved: Number(milestonesAchieved),
    tasksDone: Number(tasksDone),
    activeNow: Number(activeNow),
    active24h: Number(active24h),
    active7d: Number(active7d),
    mrr: Number(premium) * priceMonthly,
    planDistribution: planRows.map((r) => ({ plan: r.plan, count: Number(r.n) })),
    growthByMonth: growth.map((r) => ({ month: r.month, count: Number(r.n) })),
    contentCounts: {
      milestones: Number(refM[0].n),
      immunizations: Number(refI[0].n),
      teeth: Number(refT[0].n),
      sleep: Number(refS[0].n),
    },
  });
}
