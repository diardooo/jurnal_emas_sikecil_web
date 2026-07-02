/**
 * Pure moderation-callback helpers (JES-111). Cloudinary calls our webhook when
 * an asynchronously-moderated asset is approved/rejected. Both the signature
 * check and the payload→status mapping are pure so they're fully unit-testable
 * without env or network; the route wires them to the DB and `CLOUDINARY_API_SECRET`.
 */
import { createHash, timingSafeEqual } from "crypto";

export type MediaStatus = "pending" | "approved" | "rejected";

/**
 * Verify a Cloudinary notification signature. Cloudinary signs the webhook with
 * `X-Cld-Signature` = sha1(rawBody + timestamp + api_secret). We recompute and
 * compare in constant time so a bad/forged signature can't approve content.
 */
export function verifyCloudinaryCallback(args: {
  rawBody: string;
  timestamp: string;
  signature: string;
  secret: string;
}): boolean {
  if (!args.signature || !args.timestamp || !args.secret) return false;
  const expected = createHash("sha1")
    .update(args.rawBody + args.timestamp + args.secret)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(args.signature);
  // timingSafeEqual throws on length mismatch — a mismatch is already a fail.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface ModerationResult {
  publicId: string;
  status: MediaStatus;
  /** e.g. "aws_rek", "manual" — null when the payload omits it. */
  kind: string | null;
}

/** Map a raw Cloudinary moderation status to our own. Unknown → stay `pending`. */
export function moderationStatusToMedia(raw: unknown): MediaStatus {
  if (raw === "approved") return "approved";
  if (raw === "rejected") return "rejected";
  return "pending";
}

/**
 * Extract the actionable bits from a parsed Cloudinary notification. Returns
 * null for anything that isn't a moderation notification with a `public_id`,
 * so the route can safely ignore unrelated webhooks (e.g. eager-transform done).
 */
export function parseModerationNotification(payload: unknown): ModerationResult | null {
  if (typeof payload !== "object" || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (p.notification_type !== "moderation") return null;
  if (typeof p.public_id !== "string" || p.public_id.length === 0) return null;
  return {
    publicId: p.public_id,
    status: moderationStatusToMedia(p.moderation_status),
    kind: typeof p.moderation_kind === "string" ? p.moderation_kind : null,
  };
}
