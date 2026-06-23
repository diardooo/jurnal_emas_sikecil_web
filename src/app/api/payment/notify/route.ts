import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/app";
import { midtransConfigured, verifySignature } from "@/lib/midtrans";

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
  const settled = txStatus === "settlement" || txStatus === "capture";
  const failed = txStatus === "deny" || txStatus === "cancel" || txStatus === "expire";

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.paymentId, orderId)).limit(1);
  if (!sub) return NextResponse.json({ ok: true, note: "order tidak dikenal" });

  if (settled) {
    // orderId encodes the plan as JES-<ts>-<uid>; default 30d. Tahunan → 365d.
    const yearly = (body.item_id ?? "").includes("yearly");
    await db.update(subscriptions).set({
      plan: "premium",
      status: "active",
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + (yearly ? 365 : 30) * 864e5),
    }).where(eq(subscriptions.id, sub.id));
  } else if (failed) {
    await db.update(subscriptions).set({ status: "active", plan: "free" }).where(eq(subscriptions.id, sub.id));
  }

  return NextResponse.json({ ok: true });
}
