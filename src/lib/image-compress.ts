/**
 * Client-side image compression before upload — shrinks phone photos (often
 * 3–8 MB) to a few hundred KB so we store far less in Cloudinary/S3 and uploads
 * are faster. Pure browser APIs (createImageBitmap + canvas), no dependency.
 *
 * Downscales to fit `maxDim` (longest side) and re-encodes as JPEG at `quality`.
 * Falls back to the original File if anything is unavailable/fails.
 */
export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.8,
): Promise<Blob> {
  if (typeof document === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }
  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const longest = Math.max(width, height);
    if (longest > maxDim) {
      const scale = maxDim / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    // Keep whichever is smaller (tiny images can grow when re-encoded).
    if (blob && blob.size < file.size) return blob;
    return file;
  } catch {
    return file;
  }
}
