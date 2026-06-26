import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getUser, unauthorized } from "@/lib/api";
import { db } from "@/db";
import {
  children as childrenT,
  immunizations as immunizationsT,
  milestones as milestonesT,
  notifications as notificationsT,
  tasks as tasksT,
} from "@/db/schema/app";
import { buildReminders } from "@/lib/notifications-gen";
import type { Milestone } from "@/lib/types";

/**
 * Derive reminder notifications from the user's real data and upsert them.
 * Idempotent: every row carries a deterministic id (`auto:<kind>:…`), so calling
 * this on each login (from hydrate) never duplicates — `onConflictDoNothing`
 * skips ones already inserted. No cron needed. Logic lives in `buildReminders`.
 */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const [kids, imms, miles, allTasks] = await Promise.all([
    db.select().from(childrenT).where(eq(childrenT.userId, user.id)),
    db.select().from(immunizationsT).where(eq(immunizationsT.userId, user.id)),
    db.select().from(milestonesT).where(eq(milestonesT.userId, user.id)),
    db.select().from(tasksT).where(eq(tasksT.userId, user.id)),
  ]);

  const rows = buildReminders({
    children: kids,
    immunizations: imms,
    milestones: miles as unknown as Milestone[],
    tasks: allTasks,
    today: new Date().toISOString().slice(0, 10),
  });

  if (rows.length > 0) {
    await db
      .insert(notificationsT)
      .values(rows.map((r) => ({ ...r, userId: user.id })))
      .onConflictDoNothing();
  }

  return NextResponse.json({ generated: rows.length });
}
