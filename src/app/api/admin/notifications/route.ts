import { NextRequest, NextResponse } from "next/server";
import { count, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema/app";
import { forbidden, getAdmin } from "@/lib/admin";

/**
 * Broadcast history: notifications grouped by (title, type, date) with the
 * recipient count and how many have been read.
 */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();

  const rows = await db
    .select({
      title: notifications.title,
      type: notifications.type,
      date: notifications.date,
      body: sql<string>`max(${notifications.body})`,
      recipients: count(),
      read: sql<number>`sum(case when ${notifications.read} then 1 else 0 end)::int`,
    })
    .from(notifications)
    .groupBy(notifications.title, notifications.type, notifications.date)
    .orderBy(desc(notifications.date))
    .limit(50);

  return NextResponse.json(
    rows.map((r) => ({
      title: r.title,
      type: r.type,
      date: r.date,
      body: r.body,
      recipients: Number(r.recipients),
      read: Number(r.read),
      openRate: r.recipients ? Math.round((Number(r.read) / Number(r.recipients)) * 100) : 0,
    })),
  );
}
