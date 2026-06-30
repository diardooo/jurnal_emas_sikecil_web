import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getUser, unauthorized } from "@/lib/api";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema/app";

/** Remove the calling browser's subscription (turn off phone reminders here). */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const { endpoint } = (await req.json().catch(() => ({}))) as {
    endpoint?: string;
  };
  if (endpoint) {
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.userId, user.id),
        ),
      );
  }
  return NextResponse.json({ ok: true });
}
