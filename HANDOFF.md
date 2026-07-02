# 📋 HANDOFF — Jurnal Emas Si Kecil

**Cara pakai:** buka chat baru → bilang "baca `HANDOFF.md` lalu ikuti" → lalu prompt task berikutnya (mis. "lanjut JES-111"). Untuk perbaikan bug, pakai `BUGFIX_PROMPT.md`.

> **Status terkini (per 2026-07-02):**
> - **JES-114 sudah direkonsiliasi** & sesuai standar di sini (soft-delete via factory `resource()`, migrasi additive `0013`, FK cascade terverifikasi, 11 tes integration). Ditambahkan golden test + threshold 100% untuk `src/lib/retention.ts`.
> - **Nomor migrasi bebas berikutnya = `0014`** (JES-114 sudah memakai `0013`). JANGAN pakai angka di BACKLOG mentah-mentah — BACKLOG masih menulis 111→0013, 112→0014, 114→0015; itu SUDAH KADALUARSA. Selalu cek folder `drizzle/` (`00XX_*.sql` terbesar) sebelum bikin migrasi.
> - Total tes: **340 hijau**.

---

## A. Perintah untuk asisten (baca & patuhi persis)

Kamu melanjutkan pengerjaan proyek **Jurnal Emas Si Kecil**. Ikuti workflow & format output di bawah PERSIS. Bahasa: **Indonesia santai tapi presisi**; kalau aku minta "bahasa bayi", jelaskan super sederhana pakai analogi. **Satu task per siklus, lalu BERHENTI** — jangan lanjut ke task berikutnya tanpa aku bilang "lanjut".

### Aturan kerja (WAJIB, tiap task)

- **Satu task saja.** Jangan borong. Kalau aku tempel banyak task + "lanjut", konfirmasi dulu mulai dari mana (kecuali sudah jelas urutannya), kerjakan satu, berhenti.
- **Sebelum menulis kode:** baca semua file terkait (arsitektur, konvensi, API, model DB, dependency). Sebutkan temuan penting.
- **Implement bertahap.**
- **Gate setelah tiap perubahan** (semua harus hijau):
  - `npx tsc --noEmit`
  - `npm run lint` (harus 0 errors; warning lama react-hooks itu WAJAR, biarkan)
  - `npm run test:coverage` (threshold per-modul harus lolos)
  - `npm run build` (Next 16 — pastikan tetap hijau)
- **Buktikan gate "menggigit"** kalau relevan (mis. seed test merah → CI merah → hapus).
- **Self-review** pakai tabel vs Definition of Done.
- **Aku yang commit** (lewat IDE) — kamu jangan commit/push. Cukup sarankan pesan commit (Conventional Commits + `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`).
- Akhiri dengan "**Berhenti di sini**" + opsi task berikutnya.

### Format output tiap task selesai (tiru persis)

```
## Task JES-XXX — <judul> — SELESAI ✅
**Self-review vs Definition of Done:** <tabel kriteria | hasil>
**Deliverable (N file):** <daftar file + peran>
**Keputusan teknis (dan alasannya):** <poin bernomor, jujur soal trade-off>
**Belum di-commit.** Commit saran: `type(scope): ... (JES-XXX)`
**Berhenti di sini.** Berikutnya: <opsi>.
```

### Prinsip engineering (dari ENGINEERING_GUIDE.md — patuhi)

- **Additive only**; migrasi additive, di-apply ke Neon preview branch dulu, aku yang migrasi prod.
- **Deny-by-default, scoped by identity**; "ada tapi bukan punyamu" → 404, bukan 403.
- **Capability-gating:** integrasi opsional pakai `xConfigured()` → 503/no-op tanpa env.
- **Logika kritis = fungsi murni + golden test.** Ekstrak logika keselamatan/uang dari route/DB ke fungsi murni supaya bisa diuji tanpa I/O.
- **Coverage = ratchet per-modul** di `vitest.config.ts`. Di-threshold: modul murni safety/money (100%/tinggi). Tidak di-threshold: fungsi jaringan (midtrans HTTP), orkestrasi DB (`payment-apply.applyOrderOutcome` — diuji via integration), dispatcher client (analytics `track.ts`, sentry init).
- **Jangan pernah kirim PII/free-text** (nama, jurnal, coach, email) ke log/analytics/Sentry.
- **String user-facing baru** lewat `t()` (i18n). **Event analytics** lewat `track()` (registry `analytics/events.ts`).
- Jangan duplikasi source-of-truth.

---

## B. Snapshot proyek

- **Path:** `/Users/rousyan/Documents/SPARK PROJECTS/Website  Jurnal Emas Si Kecil - All in one parenting tracker/jurnal-emas-web`
- **Stack:** Next.js 16 (App Router) + React 19 + TS strict · Drizzle ORM + Postgres (Neon, pooled) · Better Auth · Zustand · Recharts · Cloudinary · Midtrans · Gemini · Vercel.
- **Dokumen kanon:** `PROJECT_CONTEXT.md` (log hidup), `PRD_V2.md` (apa), `BACKLOG.md` (kapan, JES-101…504 + sprint), `ARCHITECTURE.md` (bagaimana), `ENGINEERING_GUIDE.md` (aturan). Kalau ada perubahan yang menyimpang dari dok, update dok di PR yang sama.
- **Produk:** tracker tumbuh-kembang anak 0–6 th (WHO/IDAI/KPSP), ID-only, ada demo mode, admin dashboard.

## C. Infrastruktur test yang SUDAH ada (jangan bangun ulang)

- Vitest 3.2.6 + `@vitest/coverage-v8`. Import eksplisit dari `"vitest"` (globals OFF).
- `vitest.config.ts`: alias `@`→`src`, include `src/**/*.test.ts`, thresholds map per-file.
- Harness integration pglite di `src/test/pglite.ts`: Postgres in-memory, migrasi drizzle asli. Pola: `vi.mock("@/db")` → testDb; `vi.mock("@/lib/auth")` → session via header `x-test-user`. Skema tabel tetap ASLI (scoping SQL benar-benar dieksekusi).
- CI (`.github/workflows/ci.yml`): lint → tsc → `npm run test:coverage` → build.
- Scripts: `test`, `test:watch`, `test:coverage`.
- **Modul yang sudah di-threshold** (jangan turunkan): `env.ts`, `who.ts`, `red-flags.ts`, `coach-context.ts`, `api.ts`, `payment-apply.ts`, `image-sniff.ts`, `upload-policy.ts`, `csp.ts`, `i18n/index.ts`, `analytics/events.ts`, `observability.ts`, **`retention.ts`** (JES-114).

## D. Progres E0 "Fondasi Aman"

| JES | Isi | Status |
|---|---|---|
| 102 | Harness Vitest + CI | ✅ |
| 101 | Boot guard env prod (`assertProdEnv`) | ✅ |
| 103 | Golden vectors WHO z-score | ✅ |
| 104 | Tes red-flag/pembayaran/webhook (+`classifyMidtransOutcome`) | ✅ |
| 105 | Integration harness pglite (scoping + idempotensi payment) | ✅ |
| 110 | Hardening upload (folder server-side, magic-byte, EXIF strip) | ✅ |
| 108 | CSP report-only + collector | ✅ |
| 113 | Lapisan i18n `t()` | ✅ |
| 107 | Analytics `track()` + registry | ✅ |
| 106 | Sentry gated + PII scrub (DSN live di `.env`) | ✅ |
| 114 | Soft-delete + Trash/restore + export gate + purge cron | ✅ (direkonsiliasi) |

**Sisa E0 (butuh config user):**
- **111** Moderasi foto → add-on Cloudinary + migrasi **0014** (`media_assets`, `upload_usage`). Bisa dibangun **gated-first** (`cloudinaryConfigured()`) & sebagian besar teruji via pglite tanpa akun Cloudinary; enable moderasi di upload = 1 baris ter-gate.
- **112** Verifikasi email → butuh `RESEND_API_KEY`, lalu `requireEmailVerification:true` + backfill (migrasi additive). Flip flag butuh Resend aktif biar signup dev tidak terkunci.

## E. Env status

- **Terisi:** Sentry DSN (aktif di dev juga — hapus dari `.env` kalau mau prod-only, set di Vercel), VAPID/CRON (`CRON_SECRET` dipakai morning-digest & purge-deleted).
- **Belum diisi:** Cloudinary, Resend, Midtrans.

## F. Pola "keputusan teknis" yang berulang (biar konsisten)

- Ekstrak logika murni dari route/DB untuk diuji: `classifyMidtransOutcome`, `resolveUploadFolder`, `sniffImageMime`, `scrubEvent`, `buildCsp`, `ageBucket`/`buildEventProps`, `purgeCutoff`.
- Idempotensi/authz DB → uji via integration pglite, bukan mock rapuh.
- Hal eksternal berisiko → report-only / gated on env dulu (CSP report-only; Sentry gated).
- Kalau perlu import modul teruji ke config → `next.config.ts` (bukan `.mjs`).
- `instrumentation.ts` = `assertProdEnv` (guard NEXT_PHASE/NEXT_RUNTIME) + Sentry init.
- Jujur soal yang tidak bisa diuji (perilaku HTTP eksternal) — jangan klaim tercakup.
