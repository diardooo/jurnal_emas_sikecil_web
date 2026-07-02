import { describe, expect, it } from "vitest";
import { evaluateRedFlags } from "@/lib/red-flags";
import type { Milestone } from "@/lib/types";

/**
 * Screening-safety tests (JES-104). A red flag routes a parent to a health
 * worker; a missed regression or a false "overdue" both erode trust, so the
 * rules are pinned exactly (CDC "Learn the Signs. Act Early." alignment).
 */

/** Build a Milestone with only the fields `evaluateRedFlags` reads. */
function ms(o: Partial<Milestone>): Milestone {
  return {
    regressed: false,
    isCritical: false,
    status: "belum",
    ageMaxMonths: 12,
    domain: "Motorik Kasar",
    title: "milestone",
    ...o,
  } as unknown as Milestone;
}

describe("evaluateRedFlags — regression (strongest flag)", () => {
  it("flags a regressed skill at ANY age, even very young", () => {
    const flags = evaluateRedFlags(2, [ms({ regressed: true, title: "senyum" })]);
    expect(flags).toHaveLength(1);
    expect(flags[0].reason).toBe("regression");
    expect(flags[0].milestone.title).toBe("senyum");
  });

  it("flags regression even when the milestone is not critical / not overdue", () => {
    const flags = evaluateRedFlags(1, [
      ms({ regressed: true, isCritical: false, ageMaxMonths: 99 }),
    ]);
    expect(flags.map((f) => f.reason)).toEqual(["regression"]);
  });
});

describe("evaluateRedFlags — overdue critical milestones", () => {
  it("flags a critical milestone past its upper window and not yet achieved", () => {
    const flags = evaluateRedFlags(20, [
      ms({ isCritical: true, status: "belum", ageMaxMonths: 18, title: "jalan" }),
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].reason).toBe("overdue");
    expect(flags[0].monthsPastWindow).toBe(2);
  });

  it("does NOT flag when the child is still within the window", () => {
    expect(
      evaluateRedFlags(18, [ms({ isCritical: true, status: "belum", ageMaxMonths: 18 })]),
    ).toHaveLength(0);
  });

  it("does NOT flag an achieved milestone", () => {
    expect(
      evaluateRedFlags(30, [ms({ isCritical: true, status: "bisa", ageMaxMonths: 18 })]),
    ).toHaveLength(0);
  });

  it("does NOT flag a non-critical overdue milestone", () => {
    expect(
      evaluateRedFlags(30, [ms({ isCritical: false, status: "belum", ageMaxMonths: 18 })]),
    ).toHaveLength(0);
  });
});

describe("evaluateRedFlags — ordering & precedence", () => {
  it("lists regressions first, then overdue sorted by how far past the window", () => {
    const flags = evaluateRedFlags(30, [
      ms({ isCritical: true, status: "belum", ageMaxMonths: 24, title: "A(+6)" }),
      ms({ regressed: true, title: "R" }),
      ms({ isCritical: true, status: "belum", ageMaxMonths: 12, title: "B(+18)" }),
    ]);
    expect(flags.map((f) => f.reason)).toEqual(["regression", "overdue", "overdue"]);
    expect(flags[1].milestone.title).toBe("B(+18)"); // 18 months past sorts first
    expect(flags[2].milestone.title).toBe("A(+6)");
  });

  it("a regressed milestone is not double-counted as overdue", () => {
    const flags = evaluateRedFlags(30, [
      ms({ regressed: true, isCritical: true, status: "belum", ageMaxMonths: 12 }),
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].reason).toBe("regression");
  });

  it("returns nothing for a healthy, on-track child", () => {
    expect(
      evaluateRedFlags(24, [
        ms({ isCritical: true, status: "bisa", ageMaxMonths: 18 }),
        ms({ isCritical: false, status: "belum", ageMaxMonths: 12 }),
      ]),
    ).toEqual([]);
  });
});
