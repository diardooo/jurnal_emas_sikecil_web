import { describe, expect, it } from "vitest";
import { purgeCutoff, SOFT_DELETE_RETENTION_DAYS } from "./retention";

/**
 * Golden tests for the Trash retention window (JES-114). `purgeCutoff` decides
 * which soft-deleted rows the cron destroys forever, so it's a safety-critical
 * pure function and locked at 100% by the vitest per-module threshold. Both the
 * explicit-`now` and the defaulted-`now` paths are exercised.
 */
describe("retention — SOFT_DELETE_RETENTION_DAYS", () => {
  it("is 30 days", () => {
    expect(SOFT_DELETE_RETENTION_DAYS).toBe(30);
  });
});

describe("retention — purgeCutoff", () => {
  it("returns exactly 30 days before the given instant", () => {
    const now = new Date("2026-07-02T00:00:00.000Z");
    const cutoff = purgeCutoff(now);
    // 30 days earlier, to the millisecond.
    expect(cutoff.toISOString()).toBe("2026-06-02T00:00:00.000Z");
    expect(now.getTime() - cutoff.getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it("defaults `now` to the current time when omitted", () => {
    const before = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const cutoff = purgeCutoff().getTime();
    const after = Date.now() - 30 * 24 * 60 * 60 * 1000;
    // The defaulted cutoff must sit within the window bracketed by two live reads.
    expect(cutoff).toBeGreaterThanOrEqual(before);
    expect(cutoff).toBeLessThanOrEqual(after);
  });

  it("does not mutate the passed-in date", () => {
    const now = new Date("2026-07-02T00:00:00.000Z");
    const snapshot = now.getTime();
    purgeCutoff(now);
    expect(now.getTime()).toBe(snapshot);
  });
});
