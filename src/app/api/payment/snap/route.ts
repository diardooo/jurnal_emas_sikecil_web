import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/app";
import { getUser, unauthorized } from "@/lib/api";
import { PLAN_PRICES, createSnapTransaction, makeOrderId, midtransConfigured } from "@/lib/midtrans";

/** Start a premium checkout. body: { plan: "monthly" | "yearly" }. */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  if (!midtransConfigured()) {
    return NextResponse.json(
      { error: "Pembayaran belum aktif — set MIDTRANS_SERVER_KEY di .env" },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  const amount = PLAN_PRICES[plan];
  // Plan is encoded into the order id so the webhook can recover it.
  const orderId = makeOrderId(plan, user.id);
  const finishUrl = `${req.nextUrl.origin}/settings?paid=1`;

  try {
    const { token, redirectUrl } = await createSnapTransaction({
      orderId,
      amount,
      plan,
      customer: { name: user.name, email: user.email },
      finishUrl,
    });

    // Record a pending subscription tied to this order.
    const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
    if (existing) {
      await db.update(subscriptions).set({ status: "pending", paymentId: orderId }).where(eq(subscriptions.userId, user.id));
    } else {
      await db.insert(subscriptions).values({ userId: user.id, plan: "free", status: "pending", paymentId: orderId });
    }

    return NextResponse.json({ token, redirectUrl, orderId });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Gagal membuat transaksi" }, { status: 502 });
  }
}
