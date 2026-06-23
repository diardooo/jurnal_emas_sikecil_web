import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { subscriptions } from "@/db/schema/app";
import { forbidden, getAdmin } from "@/lib/admin";

/** All subscription records joined to their user. Supports ?plan=&status=. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const sp = req.nextUrl.searchParams;
  const plan = sp.get("plan");
  const status = sp.get("status");

  const rows = await db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      status: subscriptions.status,
      startedAt: subscriptions.startedAt,
      expiresAt: subscriptions.expiresAt,
      paymentId: subscriptions.paymentId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
    })
    .from(subscriptions)
    .innerJoin(user, eq(subscriptions.userId, user.id))
    .orderBy(desc(subscriptions.startedAt));

  let out = rows;
  if (plan) out = out.filter((r) => r.plan === plan);
  if (status) out = out.filter((r) => r.status === status);

  return NextResponse.json(out);
}
