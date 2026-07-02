# 🐛 BUGFIX PROMPT — Jurnal Emas Si Kecil

**Cara pakai:** buka chat baru → paste seluruh isi file ini (atau bilang "baca `BUGFIX_PROMPT.md` lalu ikuti") → lalu jelaskan bug-nya (gejala, langkah reproduksi, file/route yang dicurigai kalau tahu).

---

## Perintah untuk asisten (patuhi PERSIS)

Kamu memperbaiki **satu bug** di proyek **Jurnal Emas Si Kecil**. Ikuti workflow di bawah tepat seperti tertulis. Bahasa: **Indonesia santai tapi presisi** (kalau aku minta "bahasa bayi", jelaskan super sederhana pakai analogi). **Kerjakan satu bug, lalu BERHENTI** — jangan lanjut merapikan hal lain tanpa aku minta.

### Alur wajib (urut)

1. **Pahami dulu, jangan langsung nulis kode.**
   - Baca file terkait: route/handler, lib, model DB (`src/db/schema/*`), store, komponen.
   - Pahami konvensi & pola yang sudah ada (jangan bikin gaya baru).
   - Sebutkan **akar masalah (root cause)** dengan bukti (`file:baris`), bukan tebakan.

2. **Reproduksi dengan TEST yang GAGAL dulu** (disiplin wajib kami).
   - Tulis unit/integration test yang **gagal karena bug ini** (merah dulu).
   - Untuk logika murni: unit test. Untuk scoping/DB/idempotensi: integration test via harness pglite (`src/test/pglite.ts`, pola `vi.mock("@/db")` + `vi.mock("@/lib/auth")` header `x-test-user`).
   - Kalau bug murni UI/visual yang sulit dites otomatis, jelaskan kenapa, dan minimal buat langkah reproduksi manual yang jelas.

3. **Perbaiki seminimal mungkin.**
   - Fix akar masalah, bukan menutup gejala. **Additive & backward-compatible.**
   - Jangan sekalian refactor besar / rapi-rapi di luar scope bug. Kalau nemu masalah lain, **catat saja** di akhir, jangan kerjakan.
   - Kalau fix menyentuh logika keselamatan/uang, ekstrak jadi **fungsi murni** biar bisa diuji tuntas tanpa I/O.

4. **Gate — semua harus hijau** (jalankan & tunjukkan hasil):
   - `npx tsc --noEmit`
   - `npm run lint` → **0 errors** (22 warning lama react-hooks itu normal, biarkan)
   - `npm run test:coverage` → test regresi sekarang **hijau**, threshold per-modul tetap lolos
   - `npm run build` → tetap sukses (Next 16)

5. **Verifikasi tanpa regresi.** Pastikan test lain tetap lolos; fix tidak memecah perilaku existing atau data user lama.

6. **Self-review** + laporan (format di bawah). Lalu **berhenti**.

7. **Aku yang commit** (lewat IDE) — kamu **jangan commit/push**. Sarankan pesan commit saja.

### Format laporan akhir (tiru persis)

```
## Bug: <ringkas> — DIPERBAIKI ✅
**Root cause:** <penjelasan + file:baris>
**Regression test:** <nama test, dulu merah → sekarang hijau>
**Fix:** <apa yang diubah & kenapa minimal>
**Gate:** tsc ✅ · lint 0 error ✅ · test (N) ✅ · build ✅ · no regression ✅
**Deliverable (N file):** <daftar file>
**Belum di-commit.** Commit saran: `fix(scope): <ringkas> (regression test disertakan)`
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
**Catatan (kalau ada masalah lain yang kutemukan tapi TIDAK kukerjakan):** <daftar>
**Berhenti di sini.**
```

---

## Aturan engineering (jangan dilanggar saat fixing)

- **Deny-by-default, scoped by identity.** Query user-owned lewat factory `resource()`; child-scoped divalidasi `ownsChild`. "Ada tapi bukan punyamu" → **404, bukan 403**. Jangan bocorkan keberadaan data.
- **Capability-gating:** integrasi opsional (`aiConfigured`/`midtransConfigured`/`cloudinaryConfigured`/`pushConfigured`/`sentryEnabled`) → 503/no-op tanpa env. Jangan bikin fix yang crash saat env kosong.
- **Migrasi additive saja**, bernomor urut. **Verifikasi nomor migrasi terakhir** dulu dengan cek folder `drizzle/` (`00XX_*.sql` terbesar) — JANGAN asумsикan nomor. Aku yang apply ke prod.
- **Jangan pernah** kirim PII/free-text (nama, jurnal, coach, email, cookie, header auth) ke log/analytics/Sentry. Ada `scrubEvent` untuk Sentry.
- **String user-facing baru** lewat `t()` (`src/lib/i18n`). **Event analytics** lewat `track()` (registry `src/lib/analytics/events.ts`).
- **Bug fix WAJIB disertai regression test** yang gagal sebelum fix (ENGINEERING_GUIDE §14).
- **Jangan turunkan** coverage threshold yang sudah ada di `vitest.config.ts` untuk "mengakali" fix.

---

## Snapshot proyek (konteks)

- **Stack:** Next.js 16 App Router · React 19 · TS strict · Drizzle + Postgres (Neon, pooled) · Better Auth · Zustand · Recharts · Cloudinary · Midtrans · Gemini · Vercel.
- **Struktur kunci:**
  - API: `src/app/api/*/route.ts` (factory `resource()` di `src/lib/api.ts`, admin `adminResource()` di `src/lib/admin.ts`)
  - Skema DB: `src/db/schema/{app,auth,admin}.ts` · klien pooled `src/db/index.ts`
  - Logika murni teruji: `who.ts`, `red-flags.ts`, `coach-context.ts`, `payment-apply.ts` (`classifyMidtransOutcome`), `midtrans.ts`, `image-sniff.ts`, `upload-policy.ts`, `csp.ts`, `i18n/`, `analytics/events.ts`, `observability.ts`, `env.ts`
  - Boot/observability: `src/instrumentation.ts` (`assertProdEnv` + Sentry), `sentry.*.config.ts`, `src/instrumentation-client.ts`
  - Store: `src/store/app-store.ts` (Zustand, optimistic + hydrate defensif `.catch(()=>[])`)
  - Middleware auth: `src/middleware.ts`
- **Test infra (sudah ada):** Vitest 3.2.6 (import eksplisit dari `"vitest"`, globals OFF) · alias `@`→`src` · include `src/**/*.test.ts` · harness integration in-memory Postgres `src/test/pglite.ts` · CI jalankan `npm run test:coverage`.
- **Dokumen kanon:** `PROJECT_CONTEXT.md` (log), `ENGINEERING_GUIDE.md` (aturan lengkap), `ARCHITECTURE.md`, `PRD_V2.md`, `BACKLOG.md`.
- **Demo mode & data user lama:** fix tidak boleh memecah demo (tanpa DB) maupun render data lama (kolom baru harus nullable/berdefault).

---

## Checklist cepat sebelum lapor selesai

- [ ] Root cause jelas (bukan tebakan), dibuktikan `file:baris`
- [ ] Ada regression test: merah sebelum fix → hijau sesudah
- [ ] Fix minimal, additive, backward-compatible
- [ ] `tsc` ✅ · `lint` 0 error ✅ · `test:coverage` ✅ · `build` ✅
- [ ] Tidak ada regresi; demo & data lama aman
- [ ] Tidak menurunkan threshold; tidak bocor PII
- [ ] Tidak commit sendiri; pesan commit disarankan
- [ ] Berhenti setelah satu bug
