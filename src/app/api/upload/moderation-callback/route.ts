import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema/app";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import {
  parseModerationNotification,
  verifyCloudinaryCallback,
} from "@/lib/upload-moderation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cloudinary async-moderation webhook (JES-111). Server-to-server only —
 * authenticated by the `X-Cld-Signature` header, NOT a user session. A verified
 * approve/reject flips the `media_assets.status` so pending content is revealed
 * or stays hidden. Env-gated: 503 until Cloudinary is configured.
 */
export async function POST(req: NextRequest) {
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Moderation not active" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-cld-signature") ?? "";
  const timestamp = req.headers.get("x-cld-timestamp") ?? "";
  const secret = process.env.CLOUDINARY_API_SECRET ?? "";

  if (!verifyCloudinaryCallback({ rawBody, timestamp, signature, secret })) {
    // Forged/replayed/unsigned — never let it mutate moderation state.
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, ignored: true }, { status: 200 });
  }

  const result = parseModerationNotification(payload);
  if (!result) {
    // Not a moderation notification (e.g. eager-transform done) — ack & ignore.
    return NextResponse.json({ ok: false, ignored: true }, { status: 200 });
  }

  const [row] = await db
    .update(mediaAssets)
    .set({ status: result.status, moderationKind: result.kind })
    .where(eq(mediaAssets.publicId, result.publicId))
    .returning();

  // Unknown asset: ack 200 (no retry storm) but report we did nothing.
  if (!row) return NextResponse.json({ ok: false, reason: "unknown" }, { status: 200 });
  return NextResponse.json({ ok: true, status: result.status });
}
