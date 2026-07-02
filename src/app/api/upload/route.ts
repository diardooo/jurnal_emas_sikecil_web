import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/api";
import { cloudinaryConfigured, uploadImage } from "@/lib/cloudinary";
import { isPremium, premiumRequired } from "@/lib/plan";
import { sniffImageMime } from "@/lib/image-sniff";
import { isPremiumPurpose, resolveUploadFolder } from "@/lib/upload-policy";

export const runtime = "nodejs";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Authenticated image upload → Cloudinary. `purpose` decides Premium gating. */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  if (!cloudinaryConfigured()) {
    return NextResponse.json(
      { error: "Upload belum aktif — set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET di .env" },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);

  // Journal & milestone photos are Premium; profile/child photos are free.
  const purpose = String(form?.get("purpose") ?? "");
  if (isPremiumPurpose(purpose) && !(await isPremium(user.id))) {
    return premiumRequired("Foto jurnal & milestone khusus Premium. Upgrade ke Emas untuk menambahkan foto.");
  }

  const file = form?.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran maksimum 5 MB" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Hanya file gambar" }, { status: 400 });

  // Content-type is client-set and spoofable — verify the actual bytes are a
  // real image before sending anything to Cloudinary.
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!sniffImageMime(head)) {
    return NextResponse.json({ error: "Berkas bukan gambar yang valid (JPG/PNG/GIF/WebP)" }, { status: 400 });
  }

  try {
    // Folder is derived server-side from the session user + purpose — the client
    // cannot choose it (no cross-user namespace / path traversal).
    const folder = resolveUploadFolder(user.id, purpose);
    const { url } = await uploadImage(file, { folder });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload gagal" }, { status: 502 });
  }
}
