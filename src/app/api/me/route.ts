import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/app";
import { getUser, unauthorized } from "@/lib/api";
import { effectivePlan } from "@/lib/subscription";

/** Current user + subscription plan (expiry-enforced). */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  // Effective plan honours expiry. If a premium row has lapsed, lazily persist
  // the downgrade so admin views and revenue reporting stay accurate.
  const plan = effectivePlan(sub);
  if (sub && sub.plan === "premium" && plan === "free") {
    await db
      .update(subscriptions)
      .set({ plan: "free", status: "active" })
      .where(eq(subscriptions.id, sub.id));
  }

  return NextResponse.json({
    user,
    plan,
    subscription: sub ? { ...sub, plan } : null,
  });
}
