# Deployment Guide — Jurnal Emas Si Kecil

Panduan lengkap deploy ke produksi: dari nol sampai login + payment aktif.
Target skala: **1–1.000 pengguna aktif**. Semua layanan gratis kecuali catatan monetisasi.

---

## Daftar isi

1. [Arsitektur deployment](#1-arsitektur-deployment)
2. [Catatan skala & biaya](#2-catatan-skala--biaya)
3. [Bagian A — Deploy dasar (login aktif)](#bagian-a--deploy-dasar-login-aktif)
4. [Bagian B — Aktivasi fitur (email, upload, payment)](#bagian-b--aktivasi-fitur)
5. [Bagian C — Checklist final](#bagian-c--checklist-final)
6. [Troubleshooting umum](#troubleshooting-umum)

---

## 1. Arsitektur deployment

```
GitHub (repo private)
    ↓  git push → auto-trigger build
Vercel (Hobby/Pro)
    ├── next build (frontend + API route handlers)
    ├── /api/*          → route handlers (server)
    └── /admin          → route handlers (gated by role)
         ↓
      Neon PostgreSQL (cloud, ap-southeast-1)
         ↑
    Drizzle ORM + Better Auth

Integrasi opsional (env-gated):
    Resend      → email (reset password, verifikasi)
    Cloudinary  → upload foto anak & profil
    Midtrans    → pembayaran premium (Snap + webhook)
    Google OAuth → tombol "Masuk dengan Google"
```

Satu codebase = satu deployment. Client app (orang tua) dan admin dashboard
hidup di domain yang sama. Tidak ada server terpisah.

---

## 2. Catatan skala & biaya

| Layanan | Free tier | Cukup 1–1000 user? | Upgrade saat |
|---|---|---|---|
| **Vercel** Hobby | 100 GB bandwidth/bln | ✅ Teknis ya | ⚠️ Hobby = non-komersial. Saat monetisasi aktif, pindah ke **Pro ($20/bln)** |
| **Neon** Free | 0.5 GB, 191 jam compute/bln | ✅ Ya (data parenting ringan) | Storage/compute mepet → **Launch ($19/bln)** |
| **Resend** Free | 3.000 email/bln, 100/hari | ✅ Ya | Email rutin tinggi → Pro |
| **Cloudinary** Free | 25 GB storage | ✅ Ya | Foto sangat banyak |
| **Midtrans** | Tanpa biaya bulanan | ✅ Ya | — (potong per-transaksi) |

**Rekomendasi:** mulai 100% gratis untuk soft-launch. Anggarkan **~$40/bln**
(Vercel Pro + Neon Launch) begitu mulai menerima pembayaran sungguhan.

---

## Bagian A — Deploy dasar (login aktif)

### A1. Inisialisasi git

Proyek ini belum berupa git repository. Buat di dalam folder `jurnal-emas-web`:

```bash
export PATH="$HOME/.nvm/versions/node/v24.17.0/bin:$PATH"
cd "…/jurnal-emas-web"

# Pastikan .env tidak akan ter-commit
grep -q "^\.env$" .gitignore && echo "OK" || echo ".env belum di .gitignore!"

git init
git add .
git commit -m "Initial commit: Jurnal Emas Si Kecil"
```

### A2. Push ke GitHub

```bash
# Pastikan gh CLI sudah login (gh auth status)
gh repo create jurnal-emas-web --private --source=. --remote=origin --push
```

Atau buat manual di github.com lalu:
```bash
git remote add origin https://github.com/USERNAME/jurnal-emas-web.git
git push -u origin main
```

### A3. Siapkan database produksi (Neon)

1. Login **https://neon.tech** → pilih project yang sudah ada.
2. Buat **branch baru** bernama `production` (jangan pakai branch dev yang berisi data demo).
3. Di branch `production` → **Connection string** → salin URL.
   Format: `postgres://user:pass@host.neon.tech/dbname?sslmode=require`
4. Simpan URL ini — dipakai di langkah A4 dan A5.

### A4. Import project ke Vercel

1. Login **https://vercel.com** → **Add New → Project → Import Git Repository**.
2. Pilih repo `jurnal-emas-web`. Framework = **Next.js** (auto-deteksi, biarkan default).
3. Sebelum klik Deploy, buka bagian **Environment Variables** dan isi:

```
DATABASE_URL          = postgres://…NEON-PRODUKSI…?sslmode=require
BETTER_AUTH_SECRET    = <generate: openssl rand -base64 32>   ← BARU, bukan dari dev
BETTER_AUTH_URL       = https://NAMA-APP.vercel.app
NEXT_PUBLIC_APP_URL   = https://NAMA-APP.vercel.app
```

> ⚠️ BETTER_AUTH_URL dan NEXT_PUBLIC_APP_URL HARUS URL produksi, bukan localhost.
> Kalau salah, login/sesi langsung gagal. Ini titik gagal #1 yang paling umum.

4. Klik **Deploy**.

### A5. Update URL setelah deploy pertama

Setelah deploy selesai, Vercel memberi URL final (mis. `jurnal-emas-web.vercel.app`).
Kalau URL belum cocok dengan yang kamu isi di A4:

1. **Settings → Environment Variables** → update `BETTER_AUTH_URL` dan `NEXT_PUBLIC_APP_URL`.
2. **Deployments → ··· → Redeploy**.

### A6. Migrasi & seed database produksi (jalankan dari lokal, sekali)

Build Vercel tidak membuat tabel. Kamu yang jalankan dari mesin lokal:

```bash
export PATH="$HOME/.nvm/versions/node/v24.17.0/bin:$PATH"
cd "…/jurnal-emas-web"

# 1. Buat semua tabel di Neon produksi
DATABASE_URL="postgres://…NEON-PRODUKSI…?sslmode=require" \
  ./node_modules/.bin/drizzle-kit push

# 2. Seed akun super admin + konten referensi + role matrix + platform settings
DATABASE_URL="postgres://…NEON-PRODUKSI…?sslmode=require" \
  ./node_modules/.bin/tsx scripts/seed-admin.ts
```

Script seed-admin membuat:
- Akun super admin: `admin@jurnalemas.com` / `admin12345` (ganti setelah login!)
- Matriks role Free vs Premium
- Konten referensi: milestone, imunisasi, gigi, tidur
- Platform settings default

> Jangan jalankan `scripts/seed.ts` (data demo rara@email.com) di produksi.

### A7. Hardening wajib

1. Login `/admin` dengan `admin@jurnalemas.com` / `admin12345`.
2. **Ganti password admin segera** (Admin → Settings atau update via Drizzle Studio).
3. Verifikasi: buka domain produksi → `/` landing, `/demo` jalan tanpa login,
   `/login` → register akun baru → masuk → `/dashboard`.

Setelah A7: **login, register, logout, seluruh app user, dan admin dashboard sudah aktif.**

---

## Bagian B — Aktivasi fitur

Semua fitur di bawah **sudah ada kodenya** — tinggal isi env var di Vercel
lalu **Redeploy** (Settings → Environment Variables → tambah → Deployments → Redeploy).

---

### B1. Login Google (Google OAuth)

1. Buka **https://console.cloud.google.com** → buat project baru.
2. **APIs & Services → OAuth consent screen** → External → isi nama app & email.
3. **Credentials → Create Credentials → OAuth 2.0 Client ID → Web application**.
4. **Authorized redirect URIs** — isi PERSIS (termasuk path-nya):
   ```
   https://NAMA-APP.vercel.app/api/auth/callback/google
   ```
5. Salin Client ID dan Client Secret.
6. Tambah di Vercel **Environment Variables**:
   ```
   GOOGLE_CLIENT_ID     = xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET = xxxx
   ```
7. Redeploy → tombol "Masuk dengan Google" otomatis muncul.

> Tanpa env ini, tombol Google tidak tampil (bukan error) — aman.

---

### B2. Email — reset password & "Lupa sandi" (Resend)

Tanpa ini: link reset password hanya dicetak ke log server (tetap bisa diuji di dev,
tapi user tidak terima email di produksi).

1. Daftar **https://resend.com** (gratis 3.000 email/bln).
2. **Domains → Add Domain** (mis. `jurnalemas.com`).
3. Pasang DNS records yang ditampilkan (SPF + DKIM) ke penyedia domain kamu.
   Untuk uji cepat tanpa domain sendiri: pakai `onboarding@resend.dev`.
4. **API Keys → Create API Key** → salin.
5. Tambah di Vercel:
   ```
   RESEND_API_KEY = re_xxxxx
   EMAIL_FROM     = Jurnal Emas Si Kecil <no-reply@DOMAIN-KAMU>
   ```
6. Redeploy → `/forgot-password` sekarang kirim email asli ke user.

---

### B3. Upload foto anak & profil (Cloudinary)

1. Daftar **https://cloudinary.com** (free tier 25 GB).
2. Dashboard → lihat **Cloud Name**, **API Key**, **API Secret**.
3. Tambah di Vercel:
   ```
   CLOUDINARY_CLOUD_NAME = xxxx
   CLOUDINARY_API_KEY    = xxxx
   CLOUDINARY_API_SECRET = xxxx
   ```
4. Redeploy → Pengaturan → "Ubah Foto" aktif.
   Domain `res.cloudinary.com` sudah diizinkan di `next.config.mjs`.

---

### B4. Pembayaran premium (Midtrans)

Ini fitur terpenting dan paling banyak langkahnya. Kode sudah lengkap:
- `src/app/api/payment/snap/route.ts` — buat transaksi Snap
- `src/app/api/payment/notify/route.ts` — webhook, verifikasi signature SHA-512,
  otomatis flip subscription user ke `premium/active`

Kalau env Midtrans kosong: tombol "Coba Premium" jatuh ke mode trial langsung (tidak error).

#### Tahap 1 — Sandbox (uji tanpa uang asli)

1. Daftar **https://midtrans.com** → Dashboard mode **Sandbox**.
2. **Settings → Access Keys** → salin **Server Key** dan **Client Key**.
3. Tambah di Vercel:
   ```
   MIDTRANS_SERVER_KEY    = SB-Mid-server-xxxx
   MIDTRANS_CLIENT_KEY    = SB-Mid-client-xxxx
   MIDTRANS_IS_PRODUCTION = false
   PRICE_MONTHLY          = 49000    (opsional, default 49000)
   PRICE_YEARLY           = 399000   (opsional, default 399000)
   ```
4. **🔴 Daftarkan webhook — ini titik gagal #2 yang paling umum.**
   Midtrans Dashboard → **Settings → Configuration → Payment Notification URL**:
   ```
   https://NAMA-APP.vercel.app/api/payment/notify
   ```
   Tanpa ini: pembayaran berhasil di UI, tapi status premium user TIDAK ter-update.

5. Redeploy.
6. Uji dengan kartu test sandbox Midtrans (lihat docs.midtrans.com → Testing).
7. Verifikasi: setelah "bayar" → cek subscription user di admin → harus berubah jadi premium.

#### Tahap 2 — Produksi (uang asli)

Lakukan ini HANYA setelah uji sandbox lulus dan akun Midtrans produksi sudah aktif
(butuh dokumen bisnis, proses aktivasi 1–3 hari kerja).

1. **Settings → Access Keys** di dashboard **Production** → salin key (tanpa prefix `SB-`).
2. Update di Vercel:
   ```
   MIDTRANS_SERVER_KEY    = Mid-server-xxxx
   MIDTRANS_CLIENT_KEY    = Mid-client-xxxx
   MIDTRANS_IS_PRODUCTION = true
   ```
3. Daftarkan ulang Payment Notification URL di dashboard **Production**:
   ```
   https://NAMA-APP.vercel.app/api/payment/notify
   ```
4. Redeploy.

---

## Bagian C — Checklist final

### Deploy dasar

- [ ] `.env` ada di `.gitignore` (tidak ter-commit)
- [ ] `git init` + commit pertama + push ke GitHub private repo
- [ ] Neon branch `production` dibuat, connection string disalin
- [ ] Project diimport di Vercel, 4 env wajib diisi
- [ ] Deploy pertama berhasil (build hijau)
- [ ] `BETTER_AUTH_URL` dan `NEXT_PUBLIC_APP_URL` = URL Vercel produksi (bukan localhost)
- [ ] `drizzle-kit push` ke Neon produksi berhasil (semua tabel terbuat)
- [ ] `seed-admin.ts` dijalankan ke Neon produksi
- [ ] Password admin `admin12345` sudah diganti
- [ ] Verifikasi manual: landing → demo → login → dashboard → admin

### Aktivasi fitur (tambah env → Redeploy)

- [ ] **Google OAuth:** redirect URI terdaftar di Google Console = URL produksi
- [ ] **Resend:** domain DNS terpasang, `RESEND_API_KEY` + `EMAIL_FROM` diisi
- [ ] **Cloudinary:** 3 env diisi, upload foto berfungsi
- [ ] **Midtrans sandbox:** 3 env diisi, webhook URL terdaftar, uji transaksi lulus
- [ ] **Midtrans produksi:** key diganti ke non-SB, `IS_PRODUCTION=true`, webhook didaftarkan ulang

### Saat monetisasi aktif

- [ ] Vercel Hobby → **Pro** (sesuai ToS komersial)
- [ ] Neon Free → **Launch** kalau storage/compute mendekati limit

---

## Troubleshooting umum

| Gejala | Penyebab paling umum | Solusi |
|---|---|---|
| Login gagal / sesi hilang | `BETTER_AUTH_URL` masih `localhost` | Update ke URL produksi + Redeploy |
| Register berhasil tapi redirect gagal | `NEXT_PUBLIC_APP_URL` salah | Sama dengan di atas |
| "Lupa sandi" tidak kirim email | `RESEND_API_KEY` kosong atau domain belum verif | Cek Resend dashboard, DNS records |
| Bayar berhasil tapi status tetap free | Webhook belum didaftarkan di Midtrans | Settings → Payment Notification URL |
| Bayar error di sandbox | Server key salah (pakai production key di sandbox) | Pastikan key prefix `SB-` untuk sandbox |
| Upload foto gagal | Env Cloudinary kosong atau API key salah | Cek 3 env Cloudinary di Vercel |
| Tombol Google tidak muncul | `GOOGLE_CLIENT_ID` kosong | Isi env + Redeploy |
| Tombol Google muncul tapi redirect error | Redirect URI di Google Console tidak cocok | Tambahkan URI `/api/auth/callback/google` yang tepat |
| Build Vercel gagal (tsc error) | Kode ada type error | Jalankan `npm run build` lokal dulu untuk diagnosa |
| Tabel tidak ada di Neon produksi | `drizzle-kit push` belum dijalankan ke DB produksi | Jalankan A6 dengan DATABASE_URL produksi |

---

## Env var lengkap (referensi)

Salin dari `.env.example`, isi sesuai kebutuhan. Semua var opsional aman dikosongkan
— fiturnya nonaktif tapi app tidak error.

```bash
# WAJIB
DATABASE_URL="postgres://…?sslmode=require"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"
BETTER_AUTH_URL="https://NAMA-APP.vercel.app"
NEXT_PUBLIC_APP_URL="https://NAMA-APP.vercel.app"

# Google OAuth (opsional — tombol Google)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Email / Resend (opsional — reset password)
RESEND_API_KEY=""
EMAIL_FROM="Jurnal Emas Si Kecil <no-reply@DOMAIN>"

# Upload / Cloudinary (opsional — foto profil & anak)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Pembayaran / Midtrans (opsional — premium)
MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
PRICE_MONTHLY="49000"
PRICE_YEARLY="399000"

# Error monitoring / Sentry (opsional)
NEXT_PUBLIC_SENTRY_DSN=""
```

---

_Terakhir diperbarui: 22 Juni 2026_
