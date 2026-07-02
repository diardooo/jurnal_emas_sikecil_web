import { afterEach, describe, expect, it, vi } from "vitest";
import { ageInMonthsAt, getAge, initials } from "@/lib/utils";

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

describe("ageInMonthsAt — leap-year & boundary edges (JES-104)", () => {
  it("handles a Feb-29 birthday against a non-leap year", () => {
    // born 2024-02-29; on 2025-02-28 the birthday-day (29) isn't reached yet.
    expect(ageInMonthsAt("2024-02-29", "2025-02-28")).toBe(11);
    // on 2025-03-01 a full 12 months have effectively elapsed.
    expect(ageInMonthsAt("2024-02-29", "2025-03-01")).toBe(12);
  });

  it("counts exact same-day anniversaries as a completed month", () => {
    expect(ageInMonthsAt("2024-01-31", "2024-02-29")).toBe(0); // 31 not reached
    expect(ageInMonthsAt("2024-01-15", "2025-01-15")).toBe(12);
  });
});

describe("getAge — deterministic under a frozen clock (JES-104)", () => {
  afterEach(() => vi.useRealTimers());

  it("reports years + months for a 30-month-old", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T00:00:00Z"));
    const age = getAge("2024-01-01");
    expect(age.months).toBe(30);
    expect(age.label).toContain("2 tahun");
    expect(age.label).toContain("6 bulan");
  });

  it("reports days (not months) for a newborn and never goes negative", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T00:00:00Z"));
    const age = getAge("2026-07-03");
    expect(age.months).toBe(0);
    expect(age.days).toBe(7);
    expect(age.label).toContain("hari");
  });
});
