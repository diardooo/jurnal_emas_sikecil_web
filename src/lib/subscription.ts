/**
 * Single source of truth for "is this subscription actually premium right now".
 * The DB row may still say `premium` after `expiresAt` has passed (e.g. a lapsed
 * renewal) — effective access must be derived, not read raw.
 *
 * `expiresAt = null` means non-expiring premium (admin comp / lifetime), so it
 * stays active. Only a set-and-past `expiresAt` downgrades.
 */
export type SubLike = {
  plan?: string | null;
  expiresAt?: Date | string | null;
} | null | undefined;

export function isPremiumActive(sub: SubLike, now: Date = new Date()): boolean {
  if (!sub || sub.plan !== "premium") return false;
  if (!sub.expiresAt) return true;
  const exp = sub.expiresAt instanceof Date ? sub.expiresAt : new Date(sub.expiresAt);
  return exp.getTime() > now.getTime();
}

export function effectivePlan(sub: SubLike, now: Date = new Date()): "free" | "premium" {
  return isPremiumActive(sub, now) ? "premium" : "free";
}
