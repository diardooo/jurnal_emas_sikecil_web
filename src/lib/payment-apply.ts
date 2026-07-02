/**
 * Shared payment-outcome logic used by BOTH the Midtrans webhook
 * (`/api/payment/notify`) and the on-return reconciliation
 * (`/api/payment/status`). Keeping it in one place means the two paths can
 * never drift in how they settle/fail an order.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, transactions } from "@/db/schema/app";
import { planDurationDays, planFromOrderId } from "@/lib/midtrans";

export type MidtransOutcome = {
  orderId: string;
  transactionStatus: string;
  fraudStatus?: string | null;
  paymentType?: string | null;
};

/**
 * Pure money-decision: does a Midtrans transaction status mean the order is
 * settled (money in), failed, or still pending? A credit-card "capture" is only
 * money-in once fraud screening returns "accept"; a "capture" + "deny" is a
 * failure. Extracted so the safety-critical classification is unit-testable
 * without a database (the DB orchestration lives in `applyOrderOutcome`).
 */
export function classifyMidtransOutcome(
  transactionStatus: string,
  fraudStatus?: string | null,
): { settled: boolean; failed: boolean } {
  const ts = transactionStatus;
  const settled = ts === "settlement" || (ts === "capture" && fraudStatus === "accept");
  const failed =
    ts === "deny" ||
    ts === "cancel" ||
    ts === "expire" ||
    (ts === "capture" && fraudStatus === "deny");
  return { settled, failed };
}

/**
 * Reflect a Midtrans transaction outcome on the transactions row and the
 * subscription. Idempotent: re-running for the same settled order does not
 * stack extra days, and a failed checkout never downgrades a still-valid
 * premium. Returns the resulting subscription state, or null if no matching
 * subscription exists for the order.
 */
export async function applyOrderOutcome(
  o: MidtransOutcome,
): Promise<{ plan: string; status: string } | null> {
  const ts = o.transactionStatus;
  const { settled, failed } = classifyMidtransOutcome(ts, o.fraudStatus);

  // Payment-history row (idempotent by order_id).
  await db
    .update(transactions)
    .set({
      status: settled ? "paid" : failed ? (ts === "expire" ? "expired" : "failed") : "pending",
      paymentType: o.paymentType ?? null,
      paidAt: settled ? new Date() : null,
    })
    .where(eq(transactions.orderId, o.orderId));

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.paymentId, o.orderId))
    .limit(1);
  if (!sub) return null;

  if (settled) {
    const plan = planFromOrderId(o.orderId);
    const days = planDurationDays(plan);
    // Anchor the period to the first settlement so duplicate deliveries don't
    // stack extra days; a genuine renewal arrives with a fresh order id.
    const alreadyApplied = sub.status === "active" && sub.plan === "premium" && !!sub.startedAt;
    const startedAt = alreadyApplied ? sub.startedAt! : new Date();
    await db
      .update(subscriptions)
      .set({
        plan: "premium",
        status: "active",
        startedAt,
        expiresAt: new Date(startedAt.getTime() + days * 864e5),
      })
      .where(eq(subscriptions.id, sub.id));
    return { plan: "premium", status: "active" };
  }

  if (failed && sub.status === "pending") {
    // Only the pending checkout failed — clear the flag, never downgrade a
    // premium that is still valid (e.g. a failed renewal).
    await db.update(subscriptions).set({ status: "active" }).where(eq(subscriptions.id, sub.id));
    return { plan: sub.plan, status: "active" };
  }

  return { plan: sub.plan, status: sub.status };
}
