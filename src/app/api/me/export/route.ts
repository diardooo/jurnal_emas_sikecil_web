import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { getUser, unauthorized } from "@/lib/api";
import {
  categories,
  children,
  coachMessages,
  goals,
  growthRecords,
  habits,
  immunizations,
  journalEntries,
  milestones,
  notifications,
  reportShares,
  sleepLogs,
  subscriptions,
  tasks,
  teeth,
  todos,
  transactions,
} from "@/db/schema/app";

export const dynamic = "force-dynamic";

/**
 * Data portability (UU PDP / GDPR): let a parent download everything we hold
 * about them and their children as a single JSON file. Excludes internal/
 * security rows (push tokens, rate-limit counters, password hashes).
 */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const uid = user.id;
  const [
    childrenRows,
    growthRows,
    milestoneRows,
    immunRows,
    teethRows,
    sleepRows,
    journalRows,
    taskRows,
    todoRows,
    habitRows,
    goalRows,
    categoryRows,
    notificationRows,
    coachRows,
    shareRows,
    subscriptionRows,
    transactionRows,
  ] = await Promise.all([
    db.select().from(children).where(eq(children.userId, uid)),
    db.select().from(growthRecords).where(eq(growthRecords.userId, uid)),
    db.select().from(milestones).where(eq(milestones.userId, uid)),
    db.select().from(immunizations).where(eq(immunizations.userId, uid)),
    db.select().from(teeth).where(eq(teeth.userId, uid)),
    db.select().from(sleepLogs).where(eq(sleepLogs.userId, uid)),
    db.select().from(journalEntries).where(eq(journalEntries.userId, uid)),
    db.select().from(tasks).where(eq(tasks.userId, uid)),
    db.select().from(todos).where(eq(todos.userId, uid)),
    db.select().from(habits).where(eq(habits.userId, uid)),
    db.select().from(goals).where(eq(goals.userId, uid)),
    db.select().from(categories).where(eq(categories.userId, uid)),
    db.select().from(notifications).where(eq(notifications.userId, uid)),
    db.select().from(coachMessages).where(eq(coachMessages.userId, uid)),
    db.select().from(reportShares).where(eq(reportShares.userId, uid)),
    db.select().from(subscriptions).where(eq(subscriptions.userId, uid)),
    db.select().from(transactions).where(eq(transactions.userId, uid)),
  ]);

  const payload = {
    app: "Jurnal Emas Si Kecil",
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: (user as { image?: string | null }).image ?? null,
    },
    children: childrenRows,
    growthRecords: growthRows,
    milestones: milestoneRows,
    immunizations: immunRows,
    teeth: teethRows,
    sleepLogs: sleepRows,
    journalEntries: journalRows,
    tasks: taskRows,
    todos: todoRows,
    habits: habitRows,
    goals: goalRows,
    categories: categoryRows,
    notifications: notificationRows,
    coachMessages: coachRows,
    reportShares: shareRows,
    subscriptions: subscriptionRows,
    transactions: transactionRows,
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="jurnal-emas-data-${date}.json"`,
      "cache-control": "no-store",
    },
  });
}
