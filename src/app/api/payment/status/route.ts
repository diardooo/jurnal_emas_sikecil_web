import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/app";
import { getUser, unauthorized } from "@/lib/api";
import { getTransactionStatus, midtransConfigured } from "@/lib/midtrans";
import { applyOrderOutcome } from "@/lib/payment-apply";

export const runtime = "nodejs";

/**
 * On-return reconciliation. The webhook is the primary path, but it can be
 * missed/delayed — so when the buyer comes back to the app we ask Midtrans for
 * the authoritative status of THEIR OWN pending order and settle it. Scoped to
 * the caller's subscription: a user can only reconcile their own payment.
 */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  if (!midtransConfigured()) {
    return NextResponse.json({ error: "Pembayaran belum aktif" }, { status: 503 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, user.id))
    .limit(1);

  // Nothing to reconcile unless there's a pending checkout with an order id.
  if (!sub?.paymentId || sub.status !== "pending") {
    return NextResponse.json({ plan: sub?.plan ?? "free", status: sub?.status ?? "active" });
  }

  try {
    const st = await getTransactionStatus(sub.paymentId);
    if (!st) {
      return NextResponse.json({ plan: sub.plan, status: sub.status, note: "belum ada transaksi" });
    }
    const outcome = await applyOrderOutcome({
      orderId: sub.paymentId,
      transactionStatus: st.transaction_status,
      fraudStatus: st.fraud_status ?? null,
      paymentType: st.payment_type ?? null,
    });
    return NextResponse.json(outcome ?? { plan: sub.plan, status: sub.status });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Gagal cek status pembayaran" },
      { status: 502 },
    );
  }
}
