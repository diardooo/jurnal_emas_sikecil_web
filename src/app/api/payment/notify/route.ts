import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/app";
import {
  midtransConfigured,
  planDurationDays,
  planFromOrderId,
  verifySignature,
} from "@/lib/midtrans";

/**
 * Midtrans webhook (HTTP notification). Verifies signature, then flips the
 * subscription to premium/active on a settled payment.
 */
export async function POST(req: NextRequest) {
  if (!midtransConfigured()) {
    return NextResponse.json({ error: "Midtrans belum dikonfigurasi" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const valid = verifySignature({
    order_id: body.order_id ?? "",
    status_code: body.status_code ?? "",
    gross_amount: body.gross_amount ?? "",
    signature_key: body.signature_key ?? "",
  });
  if (!valid) return NextResponse.json({ error: "Signature tidak valid" }, { status: 403 });

  const orderId = body.order_id;
  const txStatus = body.transaction_status;
  // A credit-card "capture" is only money-in once fraud screening accepts it.
  const settled =
    txStatus === "settlement" ||
    (txStatus === "capture" && body.fraud_status === "accept");
  const failed =
    txStatus === "deny" ||
    txStatus === "cancel" ||
    txStatus === "expire" ||
    (txStatus === "capture" && body.fraud_status === "deny");

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.paymentId, orderId)).limit(1);
  if (!sub) return NextResponse.json({ ok: true, note: "order tidak dikenal" });

  if (settled) {
    // Plan comes from the order id (Midtrans doesn't echo our item details).
    const plan = planFromOrderId(orderId);
    const days = planDurationDays(plan);
    // Idempotent: Midtrans may resend the same notification. Anchor the period
    // to the first settlement (existing startedAt) so duplicates don't stack
    // extra days; a genuine renewal arrives with a fresh order id + pending row.
    const alreadyApplied =
      sub.status === "active" && sub.plan === "premium" && !!sub.startedAt;
    const startedAt = alreadyApplied ? sub.startedAt! : new Date();
    await db.update(subscriptions).set({
      plan: "premium",
      status: "active",
      startedAt,
      expiresAt: new Date(startedAt.getTime() + days * 864e5),
    }).where(eq(subscriptions.id, sub.id));
  } else if (failed && sub.status === "pending") {
    // Only the pending checkout failed — clear the pending flag but NEVER
    // downgrade someone whose premium is still valid (e.g. a failed renewal).
    await db.update(subscriptions).set({ status: "active" }).where(eq(subscriptions.id, sub.id));
  }

  return NextResponse.json({ ok: true });
}
