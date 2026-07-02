import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getUser, unauthorized } from "@/lib/api";
import { db } from "@/db";
import { mediaAssets, uploadUsage } from "@/db/schema/app";
import { cloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { isPremium, premiumRequired } from "@/lib/plan";
import { sniffImageMime } from "@/lib/image-sniff";
import { isPremiumPurpose, resolveUploadFolder } from "@/lib/upload-policy";
import { checkUploadQuota } from "@/lib/upload-quota";
import { t } from "@/lib/i18n";

export const runtime = "nodejs";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Authenticated image upload → Cloudinary. `purpose` decides Premium gating. */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: t("upload.notActive") }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);

  // Journal & milestone photos are Premium; profile/child photos are free.
  const purpose = String(form?.get("purpose") ?? "");
  if (isPremiumPurpose(purpose) && !(await isPremium(user.id))) {
    return premiumRequired(t("upload.premiumOnly"));
  }

  const file = form?.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: t("upload.notFound") }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: t("upload.tooLarge", { mb: MAX_BYTES / (1024 * 1024) }) }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: t("upload.notImageType") }, { status: 400 });

  // Content-type is client-set and spoofable — verify the actual bytes are a
  // real image before sending anything to Cloudinary.
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniffImageMime(head)) {
    return NextResponse.json({ error: t("upload.notImage") }, { status: 400 });
  }

  // Per-user daily upload quota (JES-111) — fail fast BEFORE hitting Cloudinary.
  const premium = await isPremium(user.id);
  const today = new Date().toISOString().slice(0, 10);
  const [usage] = await db
    .select({ count: uploadUsage.count, bytes: uploadUsage.bytes })
    .from(uploadUsage)
    .where(and(eq(uploadUsage.userId, user.id), eq(uploadUsage.date, today)))
    .limit(1);
  const quota = checkUploadQuota(
    { count: usage?.count ?? 0, bytes: usage?.bytes ?? 0 },
    file.size,
    premium ? "premium" : "free",
  );
  if (!quota.allowed) {
    return NextResponse.json(
      { error: t("upload.quota"), premiumRequired: !premium },
      { status: 429 },
    );
  }

  try {
    // Folder is derived server-side from the session user + purpose — the client
    // cannot choose it (no cross-user namespace / path traversal).
    const folder = resolveUploadFolder(user.id, purpose);
    const { url, publicId } = await uploadImage(file, { folder });

    // Record the asset + count usage only on a real success (a failed upload
    // consumes no quota). Moderation is not yet requested at upload time, so the
    // asset is immediately `approved`; the callback route flips this once async
    // moderation is enabled. Usage is an atomic per-day upsert like coachUsage.
    await Promise.all([
      db
        .insert(mediaAssets)
        .values({ userId: user.id, publicId, url, purpose, status: "approved" }),
      db
        .insert(uploadUsage)
        .values({ userId: user.id, date: today, count: 1, bytes: file.size })
        .onConflictDoUpdate({
          target: [uploadUsage.userId, uploadUsage.date],
          set: {
            count: sql`${uploadUsage.count} + 1`,
            bytes: sql`${uploadUsage.bytes} + ${file.size}`,
          },
        }),
    ]);

    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload gagal" }, { status: 502 });
  }
}
