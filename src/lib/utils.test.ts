import { describe, expect, it } from "vitest";
import { ageInMonthsAt, initials } from "@/lib/utils";

/**
 * Harness smoke test (JES-102). Its job is to prove the Vitest setup works
 * end-to-end against real `src` code via the `@/` alias — NOT to fully cover
 * these utilities. `ageInMonthsAt` is chosen because it is genuinely pure
 * (no `Date.now()`), so the assertions are deterministic. Module-level coverage
 * (WHO math, red-flags, payment) arrives in JES-103/JES-104.
 */
describe("test harness smoke (JES-102)", () => {
  it("resolves the @/ alias and runs a pure util deterministically", () => {
    // 2024-01-15 → 2025-03-15 is 14 completed months.
    expect(ageInMonthsAt("2024-01-15", "2025-03-15")).toBe(14);
  });

  it("never returns a negative age (clamped at 0)", () => {
    // measurement date before birth → clamped, not negative.
    expect(ageInMonthsAt("2024-06-01", "2024-01-01")).toBe(0);
  });

  it("counts a partial final month as not-yet-complete", () => {
    // birth day-of-month not reached → the final month is not counted.
    expect(ageInMonthsAt("2024-01-20", "2024-02-10")).toBe(0);
    expect(ageInMonthsAt("2024-01-20", "2024-02-20")).toBe(1);
  });

  it("derives initials (sanity check on a second export)", () => {
    expect(initials("Kyara Zivanya")).toBe("KZ");
  });
});
