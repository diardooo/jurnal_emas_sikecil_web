import { NextRequest, NextResponse } from "next/server";
import { midtransConfigured, verifySignature } from "@/lib/midtrans";
import { applyOrderOutcome } from "@/lib/payment-apply";

/**
 * Midtrans webhook (HTTP notification). Verifies signature, then settles the
 * order via the shared `applyOrderOutcome` (same logic as on-return reconcile).
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

  const outcome = await applyOrderOutcome({
    orderId: body.order_id,
    transactionStatus: body.transaction_status,
    fraudStatus: body.fraud_status,
    paymentType: body.payment_type,
  });

  return NextResponse.json(outcome ? { ok: true } : { ok: true, note: "order tidak dikenal" });
}
