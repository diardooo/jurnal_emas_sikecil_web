/**
 * Upload policy (JES-110) — pure, shared by the upload route.
 *
 * The destination folder is derived SERVER-SIDE from the session user id and an
 * allow-listed purpose, so a client can never point an upload at another user's
 * namespace or inject path traversal via a `folder` field.
 */

/** Photo purposes that are Premium-only (profile & child photos stay free). */
export const PREMIUM_PURPOSES = new Set(["journal", "milestone"]);

/** Purposes we recognise; anything else is bucketed under "misc". */
const ALLOWED_PURPOSES = new Set(["profile", "child", "journal", "milestone"]);

export function isPremiumPurpose(purpose: string): boolean {
  return PREMIUM_PURPOSES.has(purpose);
}

/**
 * Server-authoritative Cloudinary folder for an upload. `userId` comes from the
 * session (trusted); `purpose` from the client is validated against a fixed
 * allow-list, so the result is always `jurnal-emas/<uid>/<safe-purpose>`.
 */
export function resolveUploadFolder(userId: string, purpose: string): string {
  const safe = ALLOWED_PURPOSES.has(purpose) ? purpose : "misc";
  return `jurnal-emas/${userId}/${safe}`;
}
