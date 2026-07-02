import { describe, expect, it } from "vitest";
import { classifyMidtransOutcome } from "@/lib/payment-apply";

/**
 * Money-safety tests (JES-104). The settled/failed decision gates whether a
 * subscription is granted — a wrong call either gives premium away for free or
 * denies a paying parent. The full DB idempotency (no day-stacking, no downgrade
 * of a valid premium) needs a database and is covered by the integration harness
 * in JES-105; here we pin the pure classification exhaustively.
 */
describe("classifyMidtransOutcome", () => {
  it("settlement → settled", () => {
    expect(classifyMidtransOutcome("settlement")).toEqual({ settled: true, failed: false });
  });

  it("capture + fraud accept → settled", () => {
    expect(classifyMidtransOutcome("capture", "accept")).toEqual({
      settled: true,
      failed: false,
    });
  });

  it("capture + fraud deny → failed (NOT settled)", () => {
    expect(classifyMidtransOutcome("capture", "deny")).toEqual({
      settled: false,
      failed: true,
    });
  });

  it("capture with no fraud result yet → neither (pending)", () => {
    expect(classifyMidtransOutcome("capture")).toEqual({ settled: false, failed: false });
    expect(classifyMidtransOutcome("capture", null)).toEqual({ settled: false, failed: false });
  });

  it("deny / cancel / expire → failed", () => {
    for (const s of ["deny", "cancel", "expire"]) {
      expect(classifyMidtransOutcome(s)).toEqual({ settled: false, failed: true });
    }
  });

  it("pending / authorize / unknown → neither", () => {
    for (const s of ["pending", "authorize", "whatever"]) {
      expect(classifyMidtransOutcome(s)).toEqual({ settled: false, failed: false });
    }
  });

  it("never reports a status as both settled and failed", () => {
    for (const s of ["settlement", "capture", "deny", "cancel", "expire", "pending"]) {
      for (const f of ["accept", "deny", null, undefined]) {
        const { settled, failed } = classifyMidtransOutcome(s, f);
        expect(settled && failed).toBe(false);
      }
    }
  });
});
