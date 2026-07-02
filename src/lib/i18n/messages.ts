/**
 * Message catalog (JES-113). Indonesian is the default (and, for now, only)
 * locale. New user-facing strings are added here as `dotted.key: "teks"` and
 * consumed via `t()` — so a future locale is a new dictionary, not a code hunt.
 *
 * This seed intentionally covers only NEW strings (the hardened upload route);
 * the wider app stays as-is until a dedicated i18n migration. `{param}`
 * placeholders are interpolated by `t()`.
 */
export const id = {
  "upload.notActive": "Upload belum aktif — set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET di .env",
  "upload.premiumOnly": "Foto jurnal & milestone khusus Premium. Upgrade ke Emas untuk menambahkan foto.",
  "upload.notFound": "File tidak ditemukan",
  "upload.tooLarge": "Ukuran maksimum {mb} MB",
  "upload.notImageType": "Hanya file gambar",
  "upload.notImage": "Berkas bukan gambar yang valid (JPG/PNG/GIF/WebP)",
} as const;

export type Messages = typeof id;
