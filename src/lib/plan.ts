/**
 * Server-side plan resolution + the standard "this is Premium-only" response.
 * Plan is read fresh from the DB and is expiry-aware (see `effectivePlan`), so a
 * lapsed premium is correctly treated as free at enforcement time.
 */
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/app";
import { effectivePlan } from "@/lib/subscription";

export async function getUserPlan(userId: string): Promise<"free" | "premium"> {
  const [sub] = await db
    .select({ plan: subscriptions.plan, expiresAt: subscriptions.expiresAt })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return effectivePlan(sub);
}

export async function isPremium(userId: string): Promise<boolean> {
  return (await getUserPlan(userId)) === "premium";
}

/** 403 with a `premiumRequired` flag so the client can show an upsell. */
export function premiumRequired(message: string) {
  return NextResponse.json({ error: message, premiumRequired: true }, { status: 403 });
}
