import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("@/db", async () => {
  const mod = await import("@/test/pglite");
  return { db: mod.testDb, schema: mod.schema };
});

import { user } from "@/db/schema/auth";
import { subscriptions, transactions } from "@/db/schema/app";
import { applyOrderOutcome } from "@/lib/payment-apply";
import { initTestDb, testDb, truncateAll } from "@/test/pglite";

/**
 * Payment settlement idempotency (JES-105) — the DB half that JES-104's pure
 * `classifyMidtransOutcome` could not cover. A webhook can be delivered more than
 * once; settling twice must NOT stack extra premium days, and a failed renewal
 * must NOT downgrade a still-valid premium.
 */
const ORDER = "JES-monthly-1700000000000-userA1";

async function seedPendingOrder() {
  await testDb.insert(user).values({
    id: "userA",
    name: "userA",
    email: "userA@test.local",
    emailVerified: true,
  });
  await testDb.insert(subscriptions).values({
    userId: "userA",
    plan: "free",
    status: "pending",
    paymentId: ORDER,
  });
  await testDb.insert(transactions).values({
    userId: "userA",
    orderId: ORDER,
    plan: "monthly",
    amount: 49000,
    status: "pending",
  });
}

async function getSub() {
  const [s] = await testDb.select().from(subscriptions).where(eq(subscriptions.userId, "userA"));
  return s;
}

beforeAll(async () => {
  await initTestDb();
});
beforeEach(async () => {
  await truncateAll();
});

describe("applyOrderOutcome", () => {
  it("settles a pending order → premium active for ~30 days, transaction paid", async () => {
    await seedPendingOrder();
    const out = await applyOrderOutcome({
      orderId: ORDER,
      transactionStatus: "settlement",
      paymentType: "gopay",
    });
    expect(out).toEqual({ plan: "premium", status: "active" });

    const sub = await getSub();
    expect(sub.plan).toBe("premium");
    expect(sub.status).toBe("active");
    const days = (sub.expiresAt!.getTime() - sub.startedAt!.getTime()) / 864e5;
    expect(days).toBeCloseTo(30, 0);

    const [txn] = await testDb.select().from(transactions).where(eq(transactions.orderId, ORDER));
    expect(txn.status).toBe("paid");
    expect(txn.paidAt).not.toBeNull();
  });

  it("is idempotent: a duplicate settlement does NOT stack extra days", async () => {
    await seedPendingOrder();
    await applyOrderOutcome({ orderId: ORDER, transactionStatus: "settlement" });
    const first = (await getSub()).expiresAt!.getTime();

    await applyOrderOutcome({ orderId: ORDER, transactionStatus: "settlement" });
    const second = (await getSub()).expiresAt!.getTime();

    expect(second).toBe(first); // period anchored to the first settlement
  });

  it("a failed renewal does NOT downgrade a still-valid premium", async () => {
    await testDb.insert(user).values({
      id: "userA",
      name: "userA",
      email: "userA@test.local",
      emailVerified: true,
    });
    const future = new Date(Date.now() + 20 * 864e5);
    await testDb.insert(subscriptions).values({
      userId: "userA",
      plan: "premium",
      status: "active",
      startedAt: new Date(Date.now() - 10 * 864e5),
      expiresAt: future,
      paymentId: ORDER,
    });
    await testDb.insert(transactions).values({
      userId: "userA",
      orderId: ORDER,
      plan: "monthly",
      amount: 49000,
      status: "paid",
    });

    const out = await applyOrderOutcome({ orderId: ORDER, transactionStatus: "expire" });
    expect(out).toEqual({ plan: "premium", status: "active" });
    const sub = await getSub();
    expect(sub.plan).toBe("premium");
    expect(sub.status).toBe("active");
    expect(sub.expiresAt!.getTime()).toBe(future.getTime()); // untouched
  });

  it("a failed checkout on a pending sub clears the pending flag without granting premium", async () => {
    await seedPendingOrder();
    const out = await applyOrderOutcome({ orderId: ORDER, transactionStatus: "deny" });
    expect(out).toEqual({ plan: "free", status: "active" });
    const sub = await getSub();
    expect(sub.plan).toBe("free");
    expect(sub.status).toBe("active");

    const [txn] = await testDb.select().from(transactions).where(eq(transactions.orderId, ORDER));
    expect(txn.status).toBe("failed");
  });

  it("returns null for an order with no matching subscription", async () => {
    const out = await applyOrderOutcome({ orderId: "JES-monthly-unknown", transactionStatus: "settlement" });
    expect(out).toBeNull();
  });
});
