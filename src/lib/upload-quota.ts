/**
 * Pure upload-quota decision (JES-111). Extracted from the /api/upload route so
 * the abuse-control math is testable without any DB or network. The route reads
 * today's `upload_usage` row, calls this, and returns 429 when denied.
 */
import { UPLOAD_DAILY_BYTES_CAP, UPLOAD_DAILY_LIMIT } from "@/lib/gating";

export type UploadPlan = "free" | "premium";

/** Today's accumulated usage for a user (from the `upload_usage` row; 0 if none). */
export interface UploadUsage {
  count: number;
  bytes: number;
}

export type QuotaDenyReason = "count" | "bytes";

export interface QuotaDecision {
  allowed: boolean;
  /** Set only when `allowed` is false — which ceiling was hit. */
  reason?: QuotaDenyReason;
  /** Uploads still allowed today after this one would be counted. */
  remaining: number;
}

/**
 * Decide whether one more upload of `incomingBytes` is allowed today. Denies on
 * whichever ceiling is hit first: the daily file count, or the daily byte cap
 * (so a single huge-but-under-the-per-file-limit stream of files can't bomb
 * storage). `incomingBytes` is clamped at 0 to stay defensive against bad input.
 */
export function checkUploadQuota(
  usage: UploadUsage,
  incomingBytes: number,
  plan: UploadPlan,
): QuotaDecision {
  const countLimit = UPLOAD_DAILY_LIMIT[plan];
  const bytesCap = UPLOAD_DAILY_BYTES_CAP[plan];
  const incoming = Math.max(0, incomingBytes);
  const remaining = Math.max(0, countLimit - usage.count);

  if (usage.count >= countLimit) {
    return { allowed: false, reason: "count", remaining: 0 };
  }
  if (usage.bytes + incoming > bytesCap) {
    return { allowed: false, reason: "bytes", remaining };
  }
  return { allowed: true, remaining: Math.max(0, remaining - 1) };
}
