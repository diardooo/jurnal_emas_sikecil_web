/**
 * Signed Cloudinary upload via REST (no SDK). Env-gated: returns a clear error
 * until CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET are set.
 */
import { createHash } from "crypto";

export function cloudinaryConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/** Cloudinary signature = sha1 of sorted "key=value" params + api_secret. */
function sign(params: Record<string, string>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + secret).digest("hex");
}

/**
 * Incoming transformation applied BEFORE the asset is stored:
 *  - `q_auto` forces a re-encode of every upload, which drops embedded metadata
 *    (EXIF/GPS/IPTC) — protecting a child's home location from leaking in a photo;
 *  - `c_limit,w_2400,h_2400` caps runaway dimensions (bandwidth/storage at scale)
 *    without ever upscaling.
 */
export const INCOMING_TRANSFORM = "q_auto,c_limit,w_2400,h_2400";

export async function uploadImage(
  file: Blob,
  opts: { folder?: string } = {},
): Promise<{ url: string; publicId: string }> {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const folder = opts.folder ?? "jurnal-emas";
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Every signed param (except file/api_key) must be part of the signature.
  const signature = sign({ folder, timestamp, transformation: INCOMING_TRANSFORM }, apiSecret);

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("folder", folder);
  form.append("transformation", INCOMING_TRANSFORM);
  form.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cloudinary gagal (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { secure_url: string; public_id: string };
  return { url: data.secure_url, publicId: data.public_id };
}
