import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  makeOrderId,
  planDurationDays,
  planFromOrderId,
  verifySignature,
} from "@/lib/midtrans";

/**
 * Webhook-security tests (JES-104). `verifySignature` is what stops an attacker
 * from POSTing a fake "paid" notification to grant themselves premium — it MUST
 * reject any tampered field. Order-id encode/decode is money-relevant too (it
 * carries the billing plan the webhook settles).
 */
const SERVER_KEY = "SB-Mid-server-TESTKEY123";

describe("verifySignature", () => {
  const original = process.env.MIDTRANS_SERVER_KEY;
  beforeEach(() => {
    process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;
  });
  afterEach(() => {
    process.env.MIDTRANS_SERVER_KEY = original;
  });

  const params = { order_id: "JES-monthly-1700000000000-abc123", status_code: "200", gross_amount: "49000.00" };
  const validSig = () =>
    createHash("sha512")
      .update(params.order_id + params.status_code + params.gross_amount + SERVER_KEY)
      .digest("hex");

  it("accepts a correctly-signed notification", () => {
    expect(verifySignature({ ...params, signature_key: validSig() })).toBe(true);
  });

  it("rejects a tampered amount", () => {
    expect(
      verifySignature({ ...params, gross_amount: "1.00", signature_key: validSig() }),
    ).toBe(false);
  });

  it("rejects a tampered order id and status code", () => {
    expect(verifySignature({ ...params, order_id: "JES-yearly-x", signature_key: validSig() })).toBe(false);
    expect(verifySignature({ ...params, status_code: "201", signature_key: validSig() })).toBe(false);
  });

  it("rejects an empty / garbage signature", () => {
    expect(verifySignature({ ...params, signature_key: "" })).toBe(false);
    expect(verifySignature({ ...params, signature_key: "deadbeef" })).toBe(false);
  });
});

describe("planFromOrderId / planDurationDays / makeOrderId", () => {
  it("decodes the plan encoded in an order id", () => {
    expect(planFromOrderId("JES-yearly-123-abc")).toBe("yearly");
    expect(planFromOrderId("JES-monthly-123-abc")).toBe("monthly");
  });

  it("defaults unknown/malformed order ids to monthly", () => {
    expect(planFromOrderId("garbage")).toBe("monthly");
    expect(planFromOrderId("JES-weekly-1-a")).toBe("monthly");
  });

  it("maps plans to durations", () => {
    expect(planDurationDays("yearly")).toBe(365);
    expect(planDurationDays("monthly")).toBe(30);
  });

  it("round-trips makeOrderId → planFromOrderId and embeds the uid prefix", () => {
    const id = makeOrderId("yearly", "abcdef1234567890");
    expect(planFromOrderId(id)).toBe("yearly");
    expect(id.startsWith("JES-yearly-")).toBe(true);
    expect(id.endsWith("-abcdef")).toBe(true); // first 6 chars of the user id
  });
});
