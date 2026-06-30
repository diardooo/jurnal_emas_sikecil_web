import { NextRequest, NextResponse } from "next/server";
import { and, eq, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions, todos, tasks } from "@/db/schema/app";
import { pushConfigured, sendToUser } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily morning digest. Vercel Cron hits this (with `Authorization: Bearer
 * $CRON_SECRET`) once a day; for every user who opted into phone reminders we
 * count what's waiting and, if there's anything, send one gentle nudge.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const key = req.nextUrl.searchParams.get("key");
  if (secret && authHeader !== `Bearer ${secret}` && key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ error: "Push belum dikonfigurasi" }, { status: 503 });
  }

  const subRows = await db
    .selectDistinct({ userId: pushSubscriptions.userId })
    .from(pushSubscriptions);

  const today = new Date().toISOString().slice(0, 10);
  let usersNotified = 0;
  let totalSent = 0;

  for (const { userId } of subRows) {
    const [todoRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(todos)
      .where(and(eq(todos.userId, userId), eq(todos.done, false)));
    const [taskRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          ne(tasks.status, "done"),
          lte(tasks.dueDate, today),
        ),
      );

    const todoCount = todoRow?.count ?? 0;
    const taskCount = taskRow?.count ?? 0;
    if (!todoCount && !taskCount) continue;

    const parts: string[] = [];
    if (todoCount) parts.push(`${todoCount} rutinitas`);
    if (taskCount) parts.push(`${taskCount} PR jatuh tempo`);

    const res = await sendToUser(userId, {
      title: "Selamat pagi, Bun! ☀️",
      body: `Ada ${parts.join(" & ")} menunggu hari ini. Yuk dicek 💛`,
      url: "/catatan",
      tag: "morning-digest",
    });
    if (res.sent > 0) usersNotified++;
    totalSent += res.sent;
  }

  return NextResponse.json({
    candidates: subRows.length,
    usersNotified,
    sent: totalSent,
  });
}
