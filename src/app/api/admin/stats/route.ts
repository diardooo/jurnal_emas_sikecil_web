import { NextRequest, NextResponse } from "next/server";
import { and, count, countDistinct, eq, gt, gte, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { session, user } from "@/db/schema/auth";
import {
  children,
  growthRecords,
  habits,
  immunizations,
  journalEntries,
  milestones,
  subscriptions,
  tasks,
  transactions,
} from "@/db/schema/app";
import {
  platformSettings,
  refImmunizations,
  refMilestones,
  refSleep,
  refTeeth,
} from "@/db/schema/admin";
import { forbidden, getAdmin } from "@/lib/admin";
import { midtransConfigured } from "@/lib/midtrans";

/** Real integration status, derived from server env (booleans only, no secrets). */
function integrationStatus() {
  return {
    midtrans: midtransConfigured(),
    cloudinary:
      !!process.env.CLOUDINARY_CLOUD_NAME &&
      !!process.env.CLOUDINARY_API_KEY &&
      !!process.env.CLOUDINARY_API_SECRET,
    resend: !!process.env.RESEND_API_KEY,
    googleOAuth: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    gemini: !!process.env.GEMINI_API_KEY,
  };
}

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
    // Effective premium: plan=premium AND not expired (null expiry = lifetime).
    db
      .select({ premium: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.plan, "premium"),
          or(isNull(subscriptions.expiresAt), gt(subscriptions.expiresAt, now)),
        ),
      ),
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

  // ── Module adoption: distinct users who have any data in each module. The
  // denominator is total users, so each value is "% of all users who touched X".
  const [
    [{ uChildren }],
    [{ uGrowth }],
    [{ uMilestones }],
    [{ uTasks }],
    [{ uHabits }],
    [{ uJournal }],
    [{ uImmun }],
    [{ uActivated }],
  ] = await Promise.all([
    db.select({ uChildren: countDistinct(children.userId) }).from(children),
    db.select({ uGrowth: countDistinct(growthRecords.userId) }).from(growthRecords),
    db.select({ uMilestones: countDistinct(milestones.userId) }).from(milestones),
    db.select({ uTasks: countDistinct(tasks.userId) }).from(tasks),
    db.select({ uHabits: countDistinct(habits.userId) }).from(habits),
    db.select({ uJournal: countDistinct(journalEntries.userId) }).from(journalEntries),
    db.select({ uImmun: countDistinct(immunizations.userId) }).from(immunizations),
    // Activation step 4: users who have actually MARKED a milestone as achieved.
    db
      .select({ uActivated: countDistinct(milestones.userId) })
      .from(milestones)
      .where(eq(milestones.status, "bisa")),
  ]);

  const total = Number(totalUsers) || 0;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const moduleUsage = [
    { module: "Profil Anak", users: Number(uChildren), pct: pct(Number(uChildren)) },
    { module: "Tumbuh Kembang", users: Number(uGrowth), pct: pct(Number(uGrowth)) },
    { module: "Goal & Milestone", users: Number(uMilestones), pct: pct(Number(uMilestones)) },
    { module: "Task Manager", users: Number(uTasks), pct: pct(Number(uTasks)) },
    { module: "Rutinitas", users: Number(uHabits), pct: pct(Number(uHabits)) },
    { module: "Jurnal Emas", users: Number(uJournal), pct: pct(Number(uJournal)) },
    { module: "Imunisasi", users: Number(uImmun), pct: pct(Number(uImmun)) },
  ].sort((a, b) => b.users - a.users);

  // ── Activation funnel (ordered): where users drop off on the way to value.
  const activation = [
    { step: "Registrasi", users: total, pct: 100 },
    { step: "Tambah Anak", users: Number(uChildren), pct: pct(Number(uChildren)) },
    { step: "Catat Pertumbuhan", users: Number(uGrowth), pct: pct(Number(uGrowth)) },
    { step: "Tandai Milestone", users: Number(uActivated), pct: pct(Number(uActivated)) },
    { step: "Aktif 7 hari", users: Number(active7d), pct: pct(Number(active7d)) },
  ];

  // ── Real revenue per month from PAID transactions (sum of gross amount).
  // Empty until Midtrans payments land — honest, no fabricated numbers.
  const revenueRows = await db
    .select({
      month: sql<string>`to_char(${transactions.paidAt}, 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(${transactions.amount}), 0)`,
      n: count(),
    })
    .from(transactions)
    .where(eq(transactions.status, "paid"))
    .groupBy(sql`to_char(${transactions.paidAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${transactions.paidAt}, 'YYYY-MM')`);
  const revenueByMonth = revenueRows.map((r) => ({
    month: r.month,
    revenue: Number(r.revenue),
    count: Number(r.n),
  }));

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
    moduleUsage,
    activation,
    revenueByMonth,
    integrations: integrationStatus(),
  });
}
