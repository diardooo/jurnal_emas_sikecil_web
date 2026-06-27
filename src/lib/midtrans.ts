/**
 * Midtrans Snap integration via REST (no SDK). Env-gated. Sandbox by default;
 * set MIDTRANS_IS_PRODUCTION=true for live.
 *
 * Env: MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY (client key only needed by the
 * frontend Snap.js if you embed it), MIDTRANS_IS_PRODUCTION.
 */
import { createHash } from "crypto";

export function midtransConfigured() {
  return !!process.env.MIDTRANS_SERVER_KEY;
}

const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true";
const SNAP_BASE = isProd
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export const PLAN_PRICES: Record<string, number> = {
  monthly: Number(process.env.PRICE_MONTHLY ?? 49000),
  yearly: Number(process.env.PRICE_YEARLY ?? 399000),
};

export type BillingPlan = "monthly" | "yearly";

/**
 * Order id encodes the billing plan so the webhook can recover it WITHOUT a
 * separate lookup (Midtrans notifications don't echo our item details).
 * Shape: `JES-<plan>-<timestamp>-<uid6>`.
 */
export function makeOrderId(plan: BillingPlan, userId: string): string {
  return `JES-${plan}-${Date.now()}-${userId.slice(0, 6)}`;
}

/** Recover the billing plan from an order id (defaults to monthly). */
export function planFromOrderId(orderId: string): BillingPlan {
  return orderId.split("-")[1] === "yearly" ? "yearly" : "monthly";
}

/** Subscription length in days for a billing plan. */
export function planDurationDays(plan: BillingPlan): number {
  return plan === "yearly" ? 365 : 30;
}

/** Create a Snap transaction; returns the redirect/token to open Snap. */
export async function createSnapTransaction(args: {
  orderId: string;
  amount: number;
  customer: { name: string; email: string; phone?: string | null };
  plan: string;
  finishUrl?: string;
}): Promise<{ token: string; redirectUrl: string }> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!;
  const auth = Buffer.from(`${serverKey}:`).toString("base64");

  const res = await fetch(SNAP_BASE, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "content-type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      transaction_details: { order_id: args.orderId, gross_amount: args.amount },
      item_details: [{ id: args.plan, price: args.amount, quantity: 1, name: `Premium ${args.plan}` }],
      customer_details: {
        first_name: args.customer.name,
        email: args.customer.email,
        phone: args.customer.phone ?? undefined,
      },
      // Where Snap returns the buyer after they finish (configured per-tx).
      ...(args.finishUrl ? { callbacks: { finish: args.finishUrl } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Midtrans gagal (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { token: string; redirect_url: string };
  return { token: data.token, redirectUrl: data.redirect_url };
}

/** Verify Midtrans webhook signature: sha512(order_id+status_code+gross_amount+serverKey). */
export function verifySignature(p: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const expected = createHash("sha512")
    .update(p.order_id + p.status_code + p.gross_amount + serverKey)
    .digest("hex");
  return expected === p.signature_key;
}
