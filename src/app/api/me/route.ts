import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/app";
import { getUser, unauthorized } from "@/lib/api";

/** Current user + subscription plan. */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  return NextResponse.json({
    user,
    plan: sub?.plan ?? "free",
    subscription: sub ?? null,
  });
}
