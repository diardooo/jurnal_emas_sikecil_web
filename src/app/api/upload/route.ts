import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized } from "@/lib/api";
import { cloudinaryConfigured, uploadImage } from "@/lib/cloudinary";

export const runtime = "nodejs";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Authenticated image upload → Cloudinary. Returns { url }. */
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
  const file = form?.get("file");
  if (!(file instanceof Blob)) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Ukuran maksimum 5 MB" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Hanya file gambar" }, { status: 400 });

  try {
    const folder = String(form?.get("folder") ?? `jurnal-emas/${user.id}`);
    const { url } = await uploadImage(file, { folder });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload gagal" }, { status: 502 });
  }
}
