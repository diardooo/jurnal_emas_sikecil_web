# PROJECT_CONTEXT — Jurnal Emas Si Kecil

> Konteks ringkas-lengkap untuk melanjutkan pengembangan. Mencerminkan state kode
> terkini (client app + backend + admin dashboard + demo mode, semua jalan di Neon).

## 0. Mulai Cepat (baca ini dulu kalau kamu sesi/chat baru)

- **Lokasi kode:** `…/Jurnal Emas Si Kecil/Website  Jurnal Emas Si Kecil - All in one parenting tracker/jurnal-emas-web`
  (folder induk pernah memakai `:` yang merusak PATH npm — sudah di-rename jadi `-`,
  jadi `npm run dev` & `npm run db:*` kini jalan normal di IDE).
- **Status:** **PRODUCTION LIVE** di `https://jurnal-emas-sikecil-web.vercel.app`.
  Client app + backend + admin dashboard + demo mode semua jalan, terintegrasi ke Neon & terverifikasi.
  Build `tsc --noEmit` **clean**. Responsif di mobile (diuji iPhone XR 414px).
- **Akun:**
  - Super Admin: `admin@jurnalemas.com` / *(password sudah diubah dari default, lihat email/notes pribadi)*
  - User demo DB (production): `rara@email.com` — **perlu dihapus via /admin panel** (data test)
- **Database (Neon, ap-southeast-1):**
  - **Production branch** (`ep-bold-river-aor9lijq`) — dipakai Vercel, JANGAN diubah sembarangan
  - **Dev branch** (`ep-billowing-cake-aoblqmk7`) — dipakai `.env` lokal
  - `DATABASE_URL` di `.env` → dev branch (gitignored)
- **GitHub:** `https://github.com/diardooo/jurnal_emas_sikecil_web` (public repo)
- **Vercel:** project `jurnal-emas-sikecil-web`, akun `diardo`. Setiap push ke `main` → auto-deploy.
  Pastikan commit author = `diardooo` (bukan akun lain) agar Hobby plan tidak blokir.
- **Node:** via **nvm** → `~/.nvm/versions/node/v24.17.0/bin`.
- **Menjalankan command:** folder sudah tidak mengandung `:`, jadi di terminal IDE
  (Antigravity/VS Code) cukup `npm run dev`, `npm run db:migrate`, dst — selama nvm
  node tersedia di shell. (Untuk tool preview Claude, `.claude/launch.json` memanggil
  node absolut dengan path folder baru.) Bila perlu manual: `cd "…/jurnal-emas-web" && npm run dev`.
- **GOTCHA #1:** di selector Zustand **jangan** kembalikan array/objek literal baru
  (mis. `useAppStore((s) => s.x[id] ?? [])`) → "Maximum update depth exceeded" saat
  data `undefined`. Tulis `?? []` **di luar** selector: `useAppStore((s) => s.x[id]) ?? []`.
- **GOTCHA #2:** grid responsif **wajib** punya kolom dasar `grid-cols-1`
  (`grid grid-cols-1 … lg:grid-cols-3`). Tanpa itu, grid default ke 1 kolom `auto`
  yang **meluber** di mobile.
- **GOTCHA #3:** Radix `Sheet`/`Dialog` yang berisi link navigasi harus
  *controlled* & ditutup saat pindah halaman, kalau tidak overlay-nya menutupi &
  membuat halaman tak bisa diklik.
- **GOTCHA #4:** anak baru otomatis di-seed milestone/imunisasi/gigi via custom
  `POST /api/children`; growth & sleep memang kosong sampai diisi user.
- **GOTCHA #5 (Next 16):** di route handler dinamis, `params` adalah **Promise** —
  signature `ctx: { params: Promise<{ id: string }> }` lalu `const { id } = await ctx.params`.
  (Sudah diterapkan di `resource()`, `adminResource()`, & `api/admin/users/[id]`.)
  `npm install` butuh `.npmrc` `legacy-peer-deps=true` (sudah ada).
- **Cek belum-rapi:** lihat **§10 Loose Ends** + `STATUS_FILES.md`.

## 1. Produk

**Jurnal Emas Si Kecil** — web app all-in-one untuk orang tua Indonesia memantau
tumbuh kembang anak **0–6 tahun**. Mengacu **WHO Child Growth, IDAI (KPSP) &
Denver II**. Bahasa UI: **Indonesia**. Dibangun dari 3 PRD (.docx) di folder induk.

- **App user/client:** Dashboard, Tumbuh Kembang, Goal & Milestone, Task Manager,
  Rutinitas, Profil Anak, Laporan, Pengaturan.
- **Admin dashboard** (`/admin`): statistik, kelola user & langganan, kode diskon,
  matriks role, konten referensi (milestone/imunisasi/gigi/tidur), broadcast,
  pengaturan platform.
- **Demo mode** (`/demo`): jelajah fitur dengan data contoh, **tanpa login & tanpa
  menulis ke DB**.

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | **Next.js 16.2** (App Router) + **React 19.2** + TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix) — token brand di `globals.css` |
| State (client) | **Zustand** (single store, hydrate dari API + optimistic writes) |
| Charts | Recharts |
| Backend | **Next.js Route Handlers** (`src/app/api/*`) |
| ORM | **Drizzle ORM** (PostgreSQL, driver `postgres`) |
| Auth | **Better Auth** (email/password + session 30 hari; Google OAuth opsional) |
| Database | **PostgreSQL di Neon** (cloud) |
| Lainnya | lucide-react, sonner (toast), date-fns, next-themes 0.4 |

> **Catatan toolchain:** upgrade ke Next 16 + React 19 (dari Next 14.2 + React 18).
> Beberapa peer dep (better-auth, Radix, dll) masih konservatif → ada `.npmrc`
> berisi `legacy-peer-deps=true` agar `npm install` sukses. drizzle-kit 0.31.10.
> **Lint:** Next 16 menghapus `next lint`; kini ESLint 9 + **flat config**
> (`eslint.config.mjs`, ganti `.eslintrc.json` lama) via `npm run lint` (`eslint .`).
> Aturan react-hooks era React Compiler (`set-state-in-effect`, `use-memo`)
> di-set **warn** (kode lama memakai pola intentional) — gate hijau, hint tetap terlihat.
> Gate verifikasi: `tsc --noEmit` + `npm run build` + `npm run lint` semuanya bersih.

## 3. Arsitektur & Alur Data

```
Browser ──> Next.js (App Router)
  ├─ User app (client) ─> useAppStore (Zustand)
  │     StoreHydrator (di (app)/layout): jika cookie demo=1 → hydrateDemo()
  │       (mock, no network); selain itu → hydrate() (fetch paralel semua /api/*)
  │     Aksi user = optimistic lokal + save() → persist /api/* (PATCH/POST/DELETE).
  │       save() di-skip total saat demo (tidak ada tulisan ke DB).
  ├─ Admin app (/admin, client) ─> /api/admin/* (di-gate getAdmin: role admin/superadmin)
  ├─ Better Auth client (auth-client.ts) ─> /api/auth/[...all]
  └─ middleware.ts: gate rute app → redirect /login bila tak ada sesi;
        LOLOS bila cookie demo=1 (demo) atau DATABASE_URL kosong (demo lokal).

API user  (src/app/api/*)       ─> getUser(session)  ─> Drizzle ─> Neon  (scoped per-user)
API admin (src/app/api/admin/*) ─> getAdmin(session) ─> Drizzle ─> Neon  (global, no user filter)
```

## 4. Struktur Direktori (`src/`)

```
app/
  layout.tsx, globals.css, page.tsx (landing — 6 kartu fitur, tombol "Lihat Demo")
  (auth)/login, (auth)/register        — Better Auth (login/register)
  onboarding/                          — wizard 3 langkah tambah anak
  demo/page.tsx                        — set cookie demo + hydrateDemo → /dashboard
  (app)/layout.tsx                     — shell (Sidebar/Topbar/MobileNav) + StoreHydrator + DemoBanner
    dashboard, growth, goals, tasks, routines, children, reports, settings
  admin/{layout,page}.tsx              — admin dashboard (single-page client, gated by role)
  api/
    auth/[...all]                      — Better Auth
    me                                 — user + plan
    <resource>/route.ts + [id]/route.ts — CRUD user: children, tasks, todos, habits,
        milestones, goals, growth, immunizations, teeth, sleep, notifications, subscriptions
    admin/                             — stats, users(+[id],bulk), subscriptions, discounts,
        roles, settings, broadcast, children, me, content/{milestones,immunizations,teeth,sleep}
components/
  ui/        — shadcn primitives (Tabs kini scroll-horizontal di mobile)
  app/       — sidebar, topbar, mobile-nav, child-switcher, store-hydrator, demo-banner,
               dashboard-guide, *-dialog, charts, tooth-icon, notifications, task-overview
  auth/      — auth-shell, google-button ;  marketing/ — header, footer, pricing ;  brand/ — logo
db/
  index.ts           — drizzle client (postgres-js, reuse across HMR)
  schema/auth.ts     — user(+role,+status), session, account, verification
  schema/app.ts      — 12 tabel domain (user-owned)
  schema/admin.ts    — discount_codes, role_permissions, platform_settings,
                       ref_milestones, ref_immunizations, ref_teeth
lib/
  auth.ts (server) / auth-client.ts ; api.ts (resource() + getUser) / api-client.ts ;
  admin.ts (getAdmin + adminResource()) / admin-client.ts ;
  child-templates.ts (seed referensi anak), mock-data.ts (master+template),
  types.ts, who.ts (kurva WHO + z-score LMS sex-spesifik), who-lms.ts (data LMS WHO 0–60 bln
    L/P, auto-generated dari tabel resmi WHO), red-flags.ts (deteksi milestone kritis
    terlambat — CDC act early), journal.ts (mood/tag meta + resurfaceMemory),
    daily-activities.ts (ide stimulasi per fase usia — seed recommendation engine),
    domains.ts, nav.ts, utils.ts
store/app-store.ts   — Zustand: hydrate()/hydrateDemo() + aksi optimistic+persist(save gate)
middleware.ts        — auth gate (lolos demo cookie)
```
Scripts: `seed.ts`, `seed-admin.ts`, `backfill-children.ts`. Migrasi: `drizzle/`.

## 5. Model Data

**User-owned (`schema/app.ts`):** `children` · `tasks` · `todos` ·
`habits`(history jsonb) · `milestones`(per-anak) · `goals`(subGoals jsonb) ·
`growth_records` · `immunizations` · `teeth` · `sleep_logs` ·
`journal_entries`(mood/tags jsonb/media jsonb, per-anak) · `notifications` ·
`subscriptions`.

**Auth (`schema/auth.ts`):** `user` (+ `role` 'user'|'admin'|'superadmin', + `status`
'active'|'suspended', + `phone`), `session`, `account`, `verification`.

**Admin/global (`schema/admin.ts`):** `discount_codes`, `role_permissions`,
`platform_settings`, `ref_milestones`, `ref_immunizations`, `ref_teeth` (master
konten yang dikelola admin).

Anak baru otomatis di-seed: **53 milestone** (status belum; termasuk 3 skrining CDC),
**jadwal imunisasi IDAI**, **8 gigi susu** (lihat custom `POST /api/children`).
`ref_milestones` diturunkan dari satu sumber `mockMilestones` (lihat §11 M4b).

## 6. API

**User (butuh sesi, scoped per-user):**
- `ALL /api/auth/[...all]` — Better Auth. `GET /api/me` — user + plan.
- Per resource: `GET /api/<r>` (filter `?childId=`), `POST`, `PATCH /:id`, `DELETE /:id`.
  `<r>` ∈ children, tasks, todos, habits, milestones, goals, growth, immunizations,
  teeth, sleep, notifications, subscriptions. `POST /api/children` di-override (seed referensi).

**Admin (`/api/admin/*`, butuh role admin/superadmin via `getAdmin`):**
- `me`, `stats`, `users` (+`/:id`, `/bulk`), `subscriptions`, `discounts`(+`/:id`),
  `roles`, `settings`, `broadcast`, `children`,
  `content/{milestones,immunizations,teeth,sleep}` (+`/:id`).

Dalam **demo mode** semua tulisan user di-skip (lihat `save()` di store).

## 7. Setup & Menjalankan

```bash
cd jurnal-emas-web
cp .env.example .env        # isi DATABASE_URL (Neon) + BETTER_AUTH_SECRET
npm install
npm run db:generate && npm run db:migrate   # buat tabel
npm run db:seed            # user demo + data        (rara@email.com / password123)
npm run db:seed:admin      # super admin + konten ref (admin@jurnalemas.com / admin12345)
npm run dev                # http://localhost:3000
npm run db:studio          # https://local.drizzle.studio (port 4983)
```

URL penting: `/` landing · `/demo` mode demo · `/login` · `/admin` panel admin.

**Catatan environment:** folder induk sudah di-rename dari `:` ke `-`, jadi `npm run`
bekerja normal. `.env` Neon aktif (gitignored). Tanpa `DATABASE_URL`, app jalan demo-mode lokal.

## 8. Status Implementasi

**Selesai & terverifikasi (termasuk produksi):**
- **Ide Stimulasi (recommendation surface)** — tab ke-3 di halaman Goal & Milestone
  menampilkan **semua aktivitas stimulasi** untuk fase usia anak (dari `daily-activities.ts`,
  sumber yang sama dengan ritual harian), tiap kartu pakai ikon/warna domain (`domainMeta`).
  Additive, tanpa DB/API. (Personalisasi ke milestone yang sedang dikerjakan = lanjutan.)
- **Ritual Harian (kartu "Momen Hari Ini")** — di dashboard: 1 ide stimulasi 2 menit
  sesuai fase usia anak (`daily-activities.ts`, deterministik per hari) + 1 kenangan
  jurnal yang dimunculkan ulang (`resurfaceMemory`: "Setahun lalu" jika ada, kalau tidak
  kenangan terakhir); bila jurnal kosong → ajakan menulis catatan pertama. Additive UI,
  tanpa DB/API. Pondasi habit harian + seed untuk recommendation engine.
- **Jurnal Emas (fitur namesake)** — timeline kenangan per anak: catatan + suasana hati
  (mood) + tag + tanggal, dengan cari & filter (mood/tag). Tabel additive `journal_entries`
  (migrasi `0002_*`), API `/api/journal` (+`[id]`) via `resource()`, store optimistic
  (`addJournalEntry`/`updateJournalEntry`/`deleteJournalEntry`), halaman `/journal` +
  `journal-dialog.tsx`, nav item "Jurnal". **Hydrate defensif** (`.catch(()=>[])`) agar
  tabel yang belum termigrasi tidak mematahkan load app. Lampiran foto/voice = milestone
  lanjutan (butuh Cloudinary aktif); kolom `media` sudah disiapkan.
- **Deteksi "perlu diperhatikan" (red flag milestone)** — `lib/red-flags.ts` menandai
  milestone **kritis** yang belum tercapai padahal anak sudah melewati `ageMaxMonths`
  (buffer alami dari completed-months, selaras CDC "act early"). Tampil sebagai kartu
  **amber non-alarming** di tab Milestone (`goals/page.tsx`): bahasa menenangkan, tegas
  "bukan diagnosis", ajakan diskusi dengan bidan/dokter, daftar dibatasi 3 + "N lain".
- **Deteksi regresi milestone (red flag terkuat — CDC)** — kolom additive
  `milestones.regressed` (migrasi `0003_*`, default false). Orang tua menandai
  keterampilan yang **sempat bisa tapi kini hilang** lewat tombol di tiap milestone
  (`setMilestoneRegressed`); `red-flags.ts` memunculkannya **di usia berapa pun**
  (`reason: "regression"`, didahulukan di atas item telat). Badge "Keterampilan hilang".
  Backward-compatible (baris lama `false`).
- **Tumbuh kembang sex-spesifik (WHO z-score, LMS)** — klasifikasi BB/TB/lingkar kepala
  kini memakai standar WHO **per jenis kelamin** (`who-lms.ts` + `who.ts`), menampilkan
  **persentil & z-score** dan mendeteksi **stunting** (TB/U z<-2) serta berat kurang.
  `classifyWho`/`buildChartData` backward-compatible (param `sex` opsional → fallback band lama
  untuk usia >60 bln). Data LMS di-generate dari tabel resmi WHO (anthro + zscorer), bukan ditebak.
- Landing page (6 fitur) + tombol "Lihat Demo Dashboard".
- Auth: login/register/logout + **Google OAuth aktif** (env GOOGLE_CLIENT_ID/SECRET sudah di Vercel).
- **Form register** kini punya field **Nomor HP (opsional)** — terhubung ke kolom `phone` di DB.
- Onboarding, 8 halaman app, semua modul CRUD.
- Backend CRUD user + admin, integrasi frontend↔API (hydrate + optimistic persist).
- Multi-anak + seed data referensi otomatis; migrasi + seed user/admin + backfill ke Neon.
- **Admin dashboard** (statistik, user, langganan, diskon, role, konten ref, broadcast, settings).
- **Demo mode** read-only + **bug fix**: middleware sekarang menghapus cookie demo otomatis saat user
  login (sesi nyata selalu menang atas cookie demo — tidak ada lagi tampilan data demo untuk akun asli).
- **Responsif mobile** (414px).
- **Deployed ke Vercel** (production), **Neon branch terpisah** dev vs production.

**Aktivasi integrasi (tambah env → Redeploy):**
- ✅ **Google OAuth** — aktif, `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` sudah di Vercel
- ⬜ **Resend (email)** — kode siap, tinggal isi `RESEND_API_KEY` + `EMAIL_FROM`
- ⬜ **Cloudinary (upload foto)** — kode siap, tinggal isi `CLOUDINARY_*`
- ⬜ **Midtrans (payment)** — kode siap, tinggal isi `MIDTRANS_*` + daftarkan webhook

**Belum / placeholder:** lihat **§10**.

## 9. Langkah Berikutnya (urutan disarankan)

**Aktivasi integrasi (mudah — tinggal env + Redeploy):**
1. ⬜ **B2 Resend** — aktifkan email reset password nyata: daftar resend.com → isi `RESEND_API_KEY` + `EMAIL_FROM`
2. ⬜ **B3 Cloudinary** — aktifkan upload foto anak & profil: daftar cloudinary.com → isi 3 env `CLOUDINARY_*`
3. ⬜ **B4 Midtrans** — aktifkan payment premium (mulai sandbox): daftar midtrans.com → isi `MIDTRANS_*` + daftarkan webhook `/api/payment/notify`

**Fitur baru / perbaikan kode:**
4. Hapus user demo `rara@email.com` dari production via `/admin` panel.
5. Persist profil user (nama, foto, sandi) di halaman Settings — `authClient.updateUser()` + `changePassword`.
6. Generator notifikasi + reminder otomatis (imunisasi/posyandu/deadline).
7. Export PDF laporan nyata (Puppeteer/PDFKit per PRD).
8. Pendalaman admin (analytics nyata, audit log) & RBAC granular bila perlu.

**Saat monetisasi aktif:**
- Upgrade Vercel Hobby → Pro (ToS komersial).
- Midtrans sandbox → production key + `IS_PRODUCTION=true`.

## 10. Loose Ends (Technical Debt) — Detail

Berfungsi di UI tapi belum dirapikan/di-persist. Format: lokasi → kondisi → kebutuhan.

### 10.1 Kategori task & habit kustom — ✅ SELESAI (v1.1)
- **Dulu:** in-memory, **hilang saat reload**, tidak per-user/DB.
- **Sekarang:** tabel additive `categories (id,user_id,kind,name,created_at)`,
  `kind ∈ {task,habit}` (user-scoped, bukan child) + `GET/POST /api/categories`
  (lewat `resource()` factory). DB hanya menyimpan kategori **kustom**; default tetap
  di `mock-data` dan **digabung** saat `hydrate()` via `mergeCategories()` (dedupe) →
  state tetap `string[]`, **dialog tak berubah**. `addTaskCategory/addHabitCategory`
  kini optimistic + `save(apiPost("categories",{kind,name}))` (demo tetap lokal).
  Fetch via `safeList` → DB belum migrate tak mem-brick login (default tampil).
- **Migrasi:** `0004_nebulous_sharon_carter.sql` (CREATE TABLE saja, additive). 
- **AKSI DEPLOY (ops):** `npm run db:migrate` dgn `DATABASE_URL` produksi untuk
  menerapkan `0004` (bersama 0002/0003 bila prod belum di-migrate).

### 10.2 Streak global "12 hari" (statis) — ✅ SELESAI
- **Dulu:** konstanta `streak: 12` di store, tampil di banner dashboard.
- **Sekarang:** field `streak` store **dihapus**; banner derive `max(habit.streak)` per anak aktif
  di `dashboard/page.tsx` (pola sama seperti `bestStreak` di `routines/page.tsx`).
  Kartu "Pengingat Prioritas" (imunisasi & penimbangan) juga kini **derive dari data nyata**
  (imunisasi terdekat belum-selesai + pengukuran growth terakhir), tidak lagi hard-coded.
- **Lanjutan opsional:** streak harian lintas-fitur (tabel `daily_activity`) bila ingin lebih kaya.

### 10.3 Panel panduan dashboard (showGuide)
- **Lokasi:** `store/app-store.ts` (`showGuide`); `dashboard-guide.tsx`; toggle di settings.
- **Sekarang:** lokal, **reset `true` tiap reload**.
- **Dibutuhkan:** persist via `localStorage` atau kolom `user.preferences` (jsonb).

### 10.4 Settings — simpan profil / ubah foto / ubah sandi
- **Lokasi:** `settings/page.tsx` tab Akun → tombol hanya `toast`.
- **Dibutuhkan:** `authClient.updateUser({name,image})`, `changePassword`, upload foto (lihat 10.9).
- **Catatan:** field `phone` sudah ada di schema DB dan sudah di-collect saat register (form sudah ada).
  Tinggal wire di Settings untuk edit.

### 10.5 Settings — toggle preferensi notifikasi (kosmetik)
- **Lokasi:** `settings/page.tsx` (`notifSettings` Switch → toast).
- **Dibutuhkan:** simpan preferensi (jsonb/ tabel) → dipakai generator notifikasi (10.7).

### 10.6 Laporan — export PDF & share masih mock
- **Lokasi:** `reports/page.tsx` (Export PDF/Bagikan/Cetak → toast/`window.print()`).
- **Dibutuhkan:** generate PDF nyata (Puppeteer/PDFKit) + link share ber-token.

### 10.7 Notifikasi — data statis, belum ada generator
- **Lokasi:** tabel `notifications` di-seed; dibaca `notifications.tsx`.
- **Dibutuhkan:** generator otomatis (imunisasi by usia, posyandu, deadline task/habit) —
  kemungkinan cron/scheduled route. (Admin punya `broadcast` untuk kirim manual.)

### 10.8 Pembayaran Midtrans (subscription)
- **Lokasi:** `settings/page.tsx` `setPlan` → `PATCH /api/subscriptions/:id`. Tanpa pembayaran nyata.
- **Dibutuhkan:** Midtrans Snap + webhook (PRD §FR-PAY), free trial, status transaksi.

### 10.9 Mailer + verifikasi email + reset password
- **Lokasi:** `lib/auth.ts` (`requireEmailVerification:false`); "Lupa sandi?" = `href="#"`.
- **Dibutuhkan:** mailer (Resend/Nodemailer), aktifkan verifikasi & flow reset (Better Auth siap).

### 10.10 Google OAuth
- **Lokasi:** `lib/auth.ts` (aktif jika env ada), `auth/google-button.tsx`.
- **Status: ✅ AKTIF di produksi.** `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` sudah di Vercel.
  Google Cloud project: `jurnal-emas-si-kecil`. Mode: External (testing). Untuk buka ke semua user:
  Google Cloud Console → Audience → Publish App.

### 10.11 Upload media (foto anak & milestone)
- **Lokasi:** `edit-child-dialog.tsx` (foto = URL/dicebear); milestone flag `hasPhoto` tanpa upload.
- **Dibutuhkan:** storage (Cloudinary/S3) + endpoint upload.

### 10.12 Admin — sebagian masih dummy/perlu pendalaman
- **Lokasi:** `app/admin/page.tsx` + `api/admin/stats`.
- **Sekarang:** CRUD user/langganan/diskon/konten/role/settings berfungsi; sebagian
  metrik/analitik & beberapa aksi UI masih contoh/perlu dilengkapi.
- **Dibutuhkan:** statistik nyata, audit log, RBAC granular per-permission bila diperlukan.

### 10.13 Sisa kecil
- "Ingat saya 30 hari" di login = kosmetik (session memang 30 hari).
- Testimoni & angka di landing = statis (wajar untuk marketing).
- Onboarding "Lewati" → user tanpa anak sudah di-handle (`StoreHydrator` redirect `/onboarding`).

## 11. Progress Log — Audit → Roadmap → Delivery (sesi 2026-06-26)

Setelah audit produk (skor awal **62/100**) + visi 5 tahun + roadmap, dikerjakan
**per-milestone, satu fitur per siklus**, masing-masing lewat 9 langkah
(Analisis → Desain → DB → API → UI → Implementasi → Test → Self-review → Docs).

**Gerbang verifikasi tiap milestone (wajib hijau sebelum lanjut):**
```bash
npx tsc --noEmit      # typecheck — harus bersih
npm run lint          # eslint . (flat config) — exit 0
npm run build         # next build — Compiled successfully
npm run db:generate   # bila ada perubahan schema (additive)
```

**Milestone selesai & terverifikasi sesi ini (8):**

| # | Milestone | Inti perubahan | Migrasi | File baru kunci |
|---|---|---|---|---|
| M1 | WHO z-score sex-spesifik + stunting | `who.ts` z-score LMS + gender; status BB/TB/LK pakai persentil; band chart per-sex | — | `lib/who-lms.ts` (autogenerated WHO) |
| M2 | De-mock dashboard | streak = `max(habit.streak)`; kartu pengingat dari data nyata; hapus `streak` konstan | — | — |
| M3 | Red-flag milestone telat | `evaluateRedFlags` (kritis lewat `ageMaxMonths`) + kartu amber non-alarming | — | `lib/red-flags.ts` |
| Mx | Perbaiki gerbang Lint | ESLint 8→9 + **flat config** (`eslint.config.mjs`, ganti `.eslintrc.json`); `next lint`→`eslint .`; rule React-Compiler baru = warn | — | `eslint.config.mjs` |
| M6 | **Jurnal Emas** (namesake) | tabel `journal_entries`; CRUD `/api/journal`; halaman timeline + dialog; hydrate **defensif** `.catch(()=>[])` | `0002_*` | `app/(app)/journal/`, `api/journal/`, `journal-dialog.tsx`, `lib/journal.ts` |
| — | Ritual Harian | kartu "Momen Hari Ini" di dashboard (1 ide stimulasi + 1 kenangan jurnal) | — | `lib/daily-activities.ts` |
| M5 | Ide Stimulasi (recommendation surface) | tab ke-3 di `goals` menampilkan semua aktivitas fase usia (reuse `daily-activities.ts`) | — | — |
| M4a | **Deteksi regresi** milestone | kolom additive `milestones.regressed`; `setMilestoneRegressed`; `red-flags.ts` `reason: regression|overdue` | `0003_*` | — |

**⚠️ AKSI DEPLOY TERTUNDA (jalankan di produksi saat rilis):**
- `npm run db:migrate` untuk menerapkan **`0002`** (journal_entries) **dan `0003`**
  (milestones.regressed). Keduanya **additive & reversible**; tanpa migrasi,
  hydrate jurnal sudah aman (defensif → kosong), tapi fitur jurnal/regresi belum jalan.

**Hotfix alur auth (register→signout) — sesi lanjutan:**
- **Penyebab error "Gagal memuat data" setelah register/login:** `hydrate()` dulu
  *all-or-nothing* (12 fetch tanpa catch). Kalau **satu** endpoint gagal — mis.
  `GET /api/milestones` error karena kolom `regressed` belum ada di **DB yang di-query**
  (branch produksi Neon belum di-migrate, sementara `db:migrate` lokal hanya kena branch dev)
  — seluruh `Promise.all` reject → app brick.
- **Fix kode:** `hydrate()` kini resilient per-resource via `safeList()` (catch→[] + warn);
  `getMe()` & `children` tetap strict. Satu migrasi telat tak lagi mematikan login semua user.
- **Fix kode:** route `/journal` ditambahkan ke `middleware.ts` (PROTECTED + matcher) —
  sebelumnya kelewat saat menambah halaman Jurnal.
- **Fix kode (500 "Gagal menyimpan" saat tandai milestone "Sudah Bisa"):** API mengirim
  `achievedAt` sebagai string ISO, tapi kolom `timestamp` Drizzle butuh `Date`
  (`value.toISOString is not a function`). `sanitize()` di `lib/api.ts` kini meng-koersi
  string→`Date` untuk kolom `columnType === "PgTimestamp"`. Berlaku umum (semua resource).
- **WAJIB (ops):** **migrate branch PRODUKSI Neon** (yang dipakai Vercel), bukan cuma dev.
  Pastikan `DATABASE_URL` di Vercel menunjuk branch yang sudah punya `journal_entries`
  + `milestones.regressed`. Tanpa ini, login jalan tapi milestone/jurnal tampil kosong.
- **Race onboarding → dashboard — ✅ FIXED (M8, v1.1):** dulu `finish()` memanggil
  `addChild()` (POST async, fire-and-forget) lalu **langsung** `router.push` → dashboard
  re-hydrate bisa baca `children: []` (POST belum commit) → bounce balik ke onboarding +
  anak optimistik tertimpa. **Fix:** `addChild` kini kembalikan `Promise<void>` (demo →
  `Promise.resolve()`; non-demo → rantai `persist` yg bisa di-await); `finish()` jadi async,
  `await addChild()` lalu `router.replace` (+ guard double-submit `saving` + spinner di
  tombol). Hanya onboarding pemanggil `addChild` → blast radius minimal, `save()` tak diubah.

**Catatan teknik untuk sesi lanjutan:**
- **Lint** sekarang ESLint 9 flat config; warning React-Compiler (`set-state-in-effect`,
  `use-memo`, `exhaustive-deps` pada pola GOTCHA #1 `?? []`) sengaja **warn** (kode lama,
  bukan regresi) → gate tetap exit 0. Jangan call fungsi impur (`Date.now()`) langsung di
  render — sembunyikan di fungsi lib (lihat `dailyActivity` default param).
- `lib/daily-activities.ts` = **seed recommendation engine**; dipakai ritual (1) & tab Ide (semua).
- `lib/red-flags.ts` kini menggabung **regresi** (segala usia, didahulukan) + **telat** (kritis lewat window).
- Skor audit naik dari ~62 → estimasi ~78–80 (Jurnal + screening + z-score + recommendation).

**M4b — milestone CDC baru + rekonsiliasi sumber — ✅ SELESAI**
- Tambah 3 milestone skrining CDC ke `mockMilestones` (m51 menoleh saat dipanggil nama
  6–9 kritis, m52 menunjuk/joint-attention 12–18 kritis, m53 perintah 2-langkah 24–36) —
  domain kanonik (`MILESTONE_DOMAINS`). Total **53** milestone.
- **Divergensi 6-vs-50 dibereskan:** `seed-admin.ts` const `MILESTONES` kini **diturunkan
  dari `mockMilestones`** (53, kanonik, ber-`description`) — bukan lagi list 6-item domain
  "Bahasa". `ref_milestones` = satu sumber kebenaran.
- Skrip **rekonsiliasi idempotent** `scripts/add-cdc-milestones.ts` (`npm run db:cdc`):
  (1) refresh `ref_milestones` ke 53 kanonik; (2) tiap anak ditambahkan SEMUA milestone
  kanonik yg belum dimiliki (match by `title`); (3) buang "orphan" (judul di luar katalog,
  sisa ref lama domain "Bahasa") HANYA jika status masih "belum" (tanda progres dijaga).
  Terverifikasi di dev: anak normal 53; anak lama (6+3) → 53 (+1 orphan ber-status dijaga);
  run ulang +0/-0. **Penting:** anak yang terlanjur dibuat dari ref lama (mis. cuma 3–9
  milestone) baru lengkap setelah skrip ini dijalankan di DB-nya.
- **AKSI DEPLOY (ops, setelah migrate produksi):** jalankan `npm run db:cdc` dgn
  `DATABASE_URL` **produksi** → refresh katalog + backfill anak existing. Additive & aman diulang.

**M7 (v1.1) — Kategori kustom persist ke DB — ✅ SELESAI**
- Lihat §10.1. Tabel additive `categories` + `/api/categories` (resource factory);
  `hydrate()` gabung default+kustom (`mergeCategories`), dialog tak berubah; persist
  optimistic via `save()`. Migrasi `0004` (CREATE TABLE, additive). Gate hijau
  (tsc/lint/build), dev sudah di-migrate & tabel terverifikasi.
- **AKSI DEPLOY (ops):** `db:migrate` produksi untuk menerapkan `0004`.

**M8 (v1.1) — Fix race onboarding `finish()` → dashboard — ✅ SELESAI**
- Lihat catatan "Race onboarding → dashboard" di atas. Tanpa migrasi DB.
  `addChild` → `Promise<void>` (await-able); `finish()` async await + `router.replace`
  + guard `saving`. Gate hijau (tsc/lint/build).

Sesudah M8: roadmap v1.2 (AI coach grounded) & item v1.1 lain (10.3 persist guide,
10.4 settings profil/sandi).

---
Lihat `STATUS_FILES.md` untuk daftar status per-file.
