# Panduan Setup Integrasi (Kredensial)

Semua integrasi **opsional & env-gated**: kode sudah jadi, app tetap jalan tanpa key.
Begitu kamu isi env var-nya (lalu restart server), fitur langsung aktif. Isi di `.env`
(jangan commit) — daftar lengkap ada di `.env.example`.

**Urutan yang disarankan** (dari paling mudah & berdampak):
1. **Resend (email)** → mengaktifkan "Lupa sandi" + verifikasi email.
2. **Cloudinary (upload)** → foto profil & foto anak.
3. **Google OAuth** → tombol login Google.
4. **Midtrans (pembayaran)** → langganan premium nyata.
5. **Sentry** → monitoring error (paling akhir, saat sudah live).

> Catatan dev: tanpa Resend pun, tautan reset password **dicetak ke console server**
> (`npm run dev`), jadi alur "Lupa sandi" bisa diuji sekarang juga.

---

## 1. Resend — Email (reset password & verifikasi)

1. Daftar di **https://resend.com** (gratis 3.000 email/bln).
2. **Add Domain** (mis. `jurnalemas.com`) → tambahkan record DNS (SPF/DKIM) yang
   ditampilkan ke penyedia domain. Untuk coba cepat, pakai domain sandbox `onboarding@resend.dev`.
3. **API Keys → Create API Key** → salin.
4. Isi `.env`:
   ```
   RESEND_API_KEY="re_xxxxx"
   EMAIL_FROM="Jurnal Emas Si Kecil <no-reply@DOMAIN-KAMU>"
   ```
5. Restart. Uji: `/forgot-password` → cek inbox.

---

## 2. Cloudinary — Upload gambar

1. Daftar di **https://cloudinary.com** (free tier besar).
2. Di **Dashboard** ada **Cloud Name**, **API Key**, **API Secret**.
3. Isi `.env`:
   ```
   CLOUDINARY_CLOUD_NAME="xxxx"
   CLOUDINARY_API_KEY="xxxx"
   CLOUDINARY_API_SECRET="xxxx"
   ```
4. Restart. Uji: Pengaturan → **Ubah Foto** (upload signed via `/api/upload`).
   (Domain `res.cloudinary.com` sudah diizinkan di `next.config.mjs`.)

---

## 3. Google OAuth — Login Google

1. **https://console.cloud.google.com** → buat project.
2. **APIs & Services → OAuth consent screen** → isi (External, nama app, email).
3. **Credentials → Create Credentials → OAuth client ID → Web application**.
4. **Authorized redirect URIs**:
   - Dev: `http://localhost:3000/api/auth/callback/google`
   - Prod: `https://DOMAIN-KAMU/api/auth/callback/google`
5. Salin Client ID & Secret ke `.env`:
   ```
   GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="xxxx"
   ```
6. Restart. Tombol "Masuk dengan Google" otomatis aktif (lihat `src/lib/auth.ts`).

---

## 4. Midtrans — Pembayaran premium

1. Daftar di **https://midtrans.com** → masuk **Dashboard** → mode **Sandbox** dulu.
2. **Settings → Access Keys**: salin **Server Key** & **Client Key**.
3. Isi `.env`:
   ```
   MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx"
   MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxx"
   MIDTRANS_IS_PRODUCTION="false"   # true saat live
   ```
4. **Settings → Configuration → Payment Notification URL**:
   `https://DOMAIN-KAMU/api/payment/notify` (webhook; verifikasi signature otomatis).
5. Restart. Uji: Pengaturan → **Coba Premium** → diarahkan ke Snap.
   - Belum diisi? Tombol jatuh ke **mode demo** (trial langsung) — tidak error.
   - Saldo/test card sandbox: lihat docs Midtrans.

---

## 5. Sentry — Monitoring error (opsional)

1. Daftar di **https://sentry.io** → buat project **Next.js** → salin **DSN**.
2. Isi `.env`: `NEXT_PUBLIC_SENTRY_DSN="https://...ingest.sentry.io/..."`.
3. (Belum dipasang SDK-nya.) Untuk mengaktifkan penuh: `npx @sentry/wizard@latest -i nextjs`
   lalu commit file `sentry.*.config.ts` yang dihasilkan. DSN sudah disiapkan di env.

---

## Checklist deploy

- [ ] `DATABASE_URL`, `BETTER_AUTH_SECRET` (baru, `openssl rand -base64 32`), `BETTER_AUTH_URL`,
      `NEXT_PUBLIC_APP_URL` di-set ke domain produksi.
- [ ] Migrasi DB produksi: `npm run db:push` (atau `db:migrate`).
- [ ] Seed admin: `npm run db:seed:admin` → lalu **ganti password admin** & pertimbangkan
      hapus user demo.
- [ ] Isi integrasi sesuai kebutuhan (di atas).
- [ ] `npm run build` lulus; CI (`.github/workflows/ci.yml`) hijau.
