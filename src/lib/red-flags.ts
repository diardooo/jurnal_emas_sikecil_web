import type { Milestone } from "./types";

/**
 * Gentle developmental "watch" detection (CDC "Learn the Signs. Act Early.").
 *
 * Two reasons surface a milestone for discussion with a health worker:
 *  - `regression`: a previously-acquired skill is now lost (the strongest red
 *    flag — flagged at any age);
 *  - `overdue`: a critical milestone is meaningfully past its typical window
 *    without being achieved.
 *
 * This is screening guidance for parents — NOT a diagnosis — so the UI copy
 * stays calm and points to a health worker rather than alarming the parent.
 */
export type RedFlagReason = "regression" | "overdue";

export interface RedFlag {
  milestone: Milestone;
  reason: RedFlagReason;
  /** Months past the typical upper window (only for `overdue`). */
  monthsPastWindow?: number;
}

/**
 * Evaluate red flags for a child of `ageMonths`. Regressions come first (most
 * urgent), then overdue critical milestones sorted by how far past the window.
 *
 * A milestone flags as `overdue` once the child is past its typical upper
 * window (`ageMonths > ageMaxMonths`). Because `getAge` reports *completed*
 * months, this already gives ~1 month of natural buffer (e.g. "not walking by
 * 18 mo" surfaces at 19 completed months), aligned with CDC "act early" ages.
 */
export function evaluateRedFlags(
  ageMonths: number,
  milestones: Milestone[],
): RedFlag[] {
  const regressions: RedFlag[] = milestones
    .filter((m) => m.regressed)
    .map((m) => ({ milestone: m, reason: "regression" as const }));

  const overdue: RedFlag[] = milestones
    .filter(
      (m) =>
        !m.regressed &&
        m.isCritical &&
        m.status !== "bisa" &&
        ageMonths > m.ageMaxMonths,
    )
    .map((m) => ({
      milestone: m,
      reason: "overdue" as const,
      monthsPastWindow: ageMonths - m.ageMaxMonths,
    }))
    .sort((a, b) => (b.monthsPastWindow ?? 0) - (a.monthsPastWindow ?? 0));

  return [...regressions, ...overdue];
}
