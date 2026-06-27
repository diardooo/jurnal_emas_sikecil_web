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
### 10.3 Panel panduan dashboard (showGuide) — ✅ SELESAI (M9, v1.1)
- **Dulu:** lokal, reset `true` tiap reload (panduan muncul lagi walau sudah ditutup).
- **Sekarang:** persist di `localStorage` (`je:show-guide`) via helper `readGuidePref`/
  `writeGuidePref` di `store/app-store.ts`. `dismissGuide`/`setShowGuide` menulis;
  `hydrate()` membaca → `showGuide`. SSR-safe (default tampil bila tak ada `window`);
  tanpa flash karena guide hanya render setelah `hydrated`. Per-perangkat (preferensi
  UI murni → sengaja tak ke DB).

### 10.4 Settings — simpan profil / ubah foto / ubah sandi — ✅ SELESAI
- `settings/page.tsx` `AccountTab` sudah nyata (bukan toast-stub): `saveProfile` →
  `authClient.updateUser({name,phone,image})`; `changePassword` → `authClient.changePassword`
  (revokeOtherSessions); `onPickPhoto` → upload `/api/upload` lalu `updateUser({image})`.
  `phone` = Better Auth `additionalField` (lihat `auth.ts`). Email read-only (by design).

### 10.5 Settings — toggle preferensi notifikasi — ✅ SELESAI (M11, v1.1)
- **Sekarang:** komponen `NotifTab` di `settings/page.tsx`; 6 toggle persist di
  `localStorage` (`je:notif-prefs`) via lazy initializer `readNotifPrefs` (tanpa
  `useEffect` → tak menambah warning; tanpa SSR-mismatch karena di balik StoreHydrator).
  Switch kini `checked` terkontrol (bukan `defaultChecked`) → state diingat antar reload.
- **Tersisa (by design):** preferensi masih **per-perangkat**; saat generator notifikasi
  server (§10.7) dibuat, pindahkan ke DB agar backend bisa menghormatinya.

### 10.6 Laporan — export PDF — ✅ SELESAI (M15, v1.1)
- **Sekarang:** "Export PDF" → `window.print()` dgn stylesheet `@media print` di
  `globals.css` yang **mengisolasi `#report-print`** (sembunyikan sidebar/topbar/builder/
  toast, A4, `break-inside: avoid` per `.report-section`, `print-color-adjust: exact`).
  Browser "Simpan sebagai PDF" → PDF A4 nyata **termasuk grafik WHO** & desain asli.
  Nama file di-set via `document.title` sementara. **Pendekatan: print-CSS** (bukan
  Puppeteer/chromium yg berat di Vercel Hobby, bukan html2canvas yg rapuh) → nol dependency.
- **Tersisa (opsional):** "Bagikan via Link" masih salin URL biasa (belum link ber-token).

### 10.7 Notifikasi — generator otomatis — ✅ SELESAI (M14, v1.1)
- **Sekarang:** `POST /api/notifications/generate` menurunkan reminder dari data nyata:
  imunisasi jatuh-usia (belum "selesai"), red-flag milestone (reuse `evaluateRedFlags`),
  task tenggat ≤3 hari. **Idempotent tanpa cron:** tiap baris ber-id deterministik
  (`auto:<kind>:…`) + `onConflictDoNothing` → dipanggil tiap login (dari `hydrate()`,
  sebelum fetch notifications) tanpa duplikat. Inti logika murni di `lib/notifications-gen.ts`
  (`buildReminders`, unit-tested). UI `notifications.tsx` sudah memetakan `type`→ikon.
- **Tersisa (opsional):** pembersihan reminder yang sudah selesai, reminder habit, &
  honor preferensi notifikasi (§10.5, kini per-perangkat) saat pindah ke DB.

### 10.8 Pembayaran Midtrans (subscription)
- **Lokasi:** `settings/page.tsx` `setPlan` → `PATCH /api/subscriptions/:id`. Tanpa pembayaran nyata.
- **Dibutuhkan:** Midtrans Snap + webhook (PRD §FR-PAY), free trial, status transaksi.

### 10.9 Mailer + reset password — ✅ SEBAGIAN BESAR SELESAI
- **Sekarang:** `lib/mailer.ts` ada; `auth.ts` `sendResetPassword` aktif (Resend bila
  `RESEND_API_KEY`, else log ke console → tetap testable di dev). Halaman
  `forgot-password` & `reset-password` ada. Flow "Lupa sandi" jalan.
- **Tersisa (by design):** `requireEmailVerification:false` masih off untuk MVP —
  aktifkan bila ingin verifikasi email wajib.

### 10.10 Google OAuth
- **Lokasi:** `lib/auth.ts` (aktif jika env ada), `auth/google-button.tsx`.
- **Status: ✅ AKTIF di produksi.** `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` sudah di Vercel.
  Google Cloud project: `jurnal-emas-si-kecil`. Mode: External (testing). Untuk buka ke semua user:
  Google Cloud Console → Audience → Publish App.

### 10.11 Upload media (foto anak & milestone) — ✅ SELESAI
- **Infra:** `lib/cloudinary.ts` + `POST /api/upload` (auth, maks 5 MB, image-only,
  503 bila env Cloudinary belum diset).
- **Ter-wire:** foto profil user (Settings), foto anak (`edit-child-dialog.tsx`, M10),
  **foto milestone** (M12 — kolom additive `milestones.photoUrl`, action
  `setMilestonePhoto`, UI upload+thumbnail di `goals` MilestoneRow saat status "bisa").

### 10.12 Admin — sebagian masih dummy/perlu pendalaman
- **Lokasi:** `app/admin/page.tsx` + `api/admin/stats`.
- **Sekarang:** CRUD user/langganan/diskon/konten/role/settings berfungsi; **hapus user**
  (per-baris + bulk) sudah ter-wire di UI (M13) dgn guard: tak bisa hapus diri sendiri
  **maupun superadmin** (aman untuk "pilih semua → Hapus"). Sebagian metrik/analitik &
  beberapa aksi UI lain masih contoh/perlu dilengkapi.
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

**M9 (v1.1) — Persist panel panduan + rekonsiliasi doc §10 — ✅ SELESAI**
- **10.3:** `showGuide` kini persist di `localStorage` (`je:show-guide`) — lihat §10.3.
  Tanpa migrasi/API. Gate hijau (tsc/lint/build).
- **Rekonsiliasi doc-drift:** saat ambil 10.4 ternyata sudah diimplementasi di kode
  (doc stale). Diverifikasi & ditandai SELESAI: **10.4** (updateUser/changePassword/upload
  foto profil), **10.9** (mailer + reset password; verifikasi email tetap off by design),
  **10.11** (infra upload Cloudinary + foto profil; foto anak/milestone masih tersisa).
- **Pelajaran:** §10 sempat tertinggal dari kode (kedua kalinya, setelah M4b). Sebelum
  ambil item §10, **cek kode dulu** — jangan percaya status doc buta.

**M10 (v1.1) — Upload foto anak via Cloudinary — ✅ SELESAI**
- `edit-child-dialog.tsx`: tombol "Unggah Foto" (reuse pola `onPickPhoto` Settings) →
  `POST /api/upload` → set `photoUrl` lokal → persist saat "Simpan" (`updateChild`).
  Input URL tetap sebagai fallback. Tanpa migrasi/endpoint/store baru. Gate hijau.
- Lihat §10.11. **Foto milestone** masih tersisa (perlu kolom `photoUrl` + migrasi).

**M20 (v1.2) — AI Coach: kontrol percakapan + fix jawaban terpotong — ✅ SELESAI**
- **Fix kritis (uji browser user):** `gemini-2.5-flash` model thinking → token thinking
  makan `maxOutputTokens` → jawaban terpotong jadi "L" / kosong → 502. Fix di
  `lib/ai/provider.ts`: `thinkingConfig.thinkingBudget=0` + `maxOutputTokens` 800→1200;
  error kosong sertakan `finishReason`. Uji live: jawaban utuh ~2k char.
- **Kontrol:** `DELETE /api/coach?childId=` hapus riwayat (kuota harian dipertahankan);
  UI tombol "Hapus riwayat" + tampil "Sisa N pertanyaan hari ini" (dari `remaining`).
  Roundtrip delete PASS.
- **Fix (uji browser user):** hydration error di `goals` `PhaseGroup` — `<Badge>` (div)
  di dalam `<p>` → ganti `<p>`→`<div>`. Scan kode: tak ada lagi block-in-`<p>`.

**M19 (UI/UX + bugfix, 3 siklus) — ✅ SELESAI**
- **(A) Bug "Goal Orang Tua" kosong:** backend goals lengkap tapi tak ada UI buat goal +
  tak ada empty-state → akun nyata selalu blank. Tambah `components/app/goal-dialog.tsx`
  (judul/kategori/target/deskripsi/sub-goal dinamis → `addGoal`) + empty-state "Buat Goal
  Pertama" + tombol tambah di `goals` tab "goal".
- **(B) Polish panel sambutan dashboard:** `dashboard-guide.tsx` jadi **checklist progres
  nyata** — tiap langkah auto-tercentang dari data (profil terisi BB/TB lahir, ada growth,
  ada milestone "bisa", ada task/habit, report-ready) + progress bar + "X/5 selesai" +
  state hijau + perayaan saat 5/5. Selector baca ref store stabil; derivasi di render.
- **(C) Foto di jurnal:** `lib/image-compress.ts` (Canvas: `createImageBitmap`→resize 1280px
  →JPEG q0.8, ambil yang lebih kecil; tanpa dependency → hemat Cloudinary/S3). `journal-dialog`
  tambah picker foto multi (kompres→`/api/upload`→`media[]`, thumbnail+hapus). List jurnal
  tampilkan grid foto (klik→buka penuh) + badge kamera di ikon mood. Thumbnail pakai `Avatar`
  (lint-clean). Gate hijau ketiganya; tanpa migrasi.

**M18 (v1.2) — AI Coach: riwayat chat tersimpan — ✅ SELESAI**
- Percakapan dulu hilang saat reload/pindah halaman. Tabel additive
  `coach_messages(user_id, child_id→cascade, role, content)` (migrasi `0007`).
  `POST /api/coach` simpan 2 turn (user+coach) setelah jawaban sukses; `GET /api/coach?childId=`
  muat riwayat (urut, limit 100, di-map ke `{role,text}`). UI `/coach` load riwayat saat
  buka/ganti anak via effect async (tak menambah warning). Roundtrip + cascade smoke-test PASS.

**M17 (v1.2) — AI Coach: rate-limit per-user + handling 429 — ✅ SELESAI**
- **Kuota free terbukti ketat** (uji live: `gemini-2.0-flash` → 429; ganti default ke
  `gemini-2.5-flash` yang jalan). Key Gemini valid & **panggilan LLM live terverifikasi**.
- **Batas per-user/hari:** tabel additive `coach_usage(user_id, date, count, UNIQUE(user,date))`
  (migrasi `0006`). Route `/api/coach` cek limit (fail-fast, default 20 via `COACH_DAILY_LIMIT`)
  → 429 ramah; hitung **hanya pertanyaan terjawab** via upsert atomik `onConflictDoUpdate`
  (`count + 1`). 429 dari Gemini → pesan "sedang sibuk, coba lagi". UI tampilkan 429/503
  sebagai bubble tenang. Counter upsert smoke-test PASS.

**M16 (v1.2) — AI Coach "Pendamping Emas" (grounded) — ✅ SELESAI (kode)**
- **Grounded:** `lib/coach-context.ts` `buildCoachContext()` (murni, unit-tested) merangkum
  data SATU anak → profil/usia, pertumbuhan vs WHO (reuse `classifyWho` z-score), milestone
  per-domain, red-flag (reuse `evaluateRedFlags`), jurnal terbaru. System prompt
  `COACH_SYSTEM_PROMPT`: jawab HANYA dari konteks, berbasis bukti (WHO/IDAI/CDC), bukan
  diagnosis, arahkan ke nakes, Bahasa Indonesia.
- **Provider swappable** `lib/ai/provider.ts`: `generateAnswer()` via **Google Gemini REST**
  (`fetch`, tanpa dependency npm). `aiConfigured()`/`AiNotConfiguredError`. Ganti provider =
  1 file.
- **Route** `POST /api/coach` (nodejs runtime): auth → muat data anak (scoped) → context →
  LLM → `{answer}`. **503 ramah** bila `GEMINI_API_KEY` kosong (pola Cloudinary/Midtrans).
- **UI** `/coach` (`app/(app)/coach/page.tsx`): tanya-jawab + pertanyaan saran + disclaimer
  medis; demo mode diblok ramah. Nav "Pendamping AI" (Sparkles) + middleware `/coach`.
- **Env:** `GEMINI_API_KEY` (+ opsional `GEMINI_MODEL`) di `.env.example`. Key gratis:
  aistudio.google.com/apikey.
- **Status uji:** context builder & 503-path terverifikasi (gate hijau, smoke-test PASS).
  **Panggilan LLM live belum diuji** (perlu key) — user set `GEMINI_API_KEY` di `.env`
  (dev) & Vercel (prod) lalu coba di `/coach`. Tanpa migrasi DB.

**M15 (v1.1) — Export PDF laporan (print-CSS) — ✅ SELESAI**
- Lihat §10.6. `@media print` di `globals.css` isolasi `#report-print`; `reports/page.tsx`
  `exportPdf()` (window.print + filename via document.title), `report-section` per Section,
  `print:hidden` bar pratinjau. Nol dependency, tanpa migrasi/server (aman Vercel Hobby).
  Gate hijau. **Catatan:** belum uji-visual (perlu cek grafik/warna saat cetak di browser).

**M14 (v1.1) — Generator notifikasi otomatis — ✅ SELESAI**
- Lihat §10.7. `lib/notifications-gen.ts` (`buildReminders`, murni & unit-tested) +
  `POST /api/notifications/generate` (Promise.all baca children/imun/milestone/task →
  upsert `onConflictDoNothing` dgn id deterministik). `hydrate()` generate-lalu-fetch
  (dibungkus `safeList`). Tanpa migrasi/dependency baru. Gate hijau; smoke-test logika
  PASS (imun jatuh-usia + 2 red-flag + task H-2; done/belum-usia/lewat di-skip).

**M13 (admin) — Hapus user di panel admin — ✅ SELESAI**
- Backend hapus user sudah ada (`DELETE /api/admin/users/[id]` + `POST .../bulk` action
  `delete`); yang kurang hanya UI. Ditambah **tombol Hapus** per-baris + bulk bar
  (`app/admin/page.tsx`), `runBulk` diperluas ke `"delete"`, `delUser()`, konfirmasi.
- **Guard keamanan:** backend kini tolak hapus **superadmin** (bukan cuma self) — single
  (`DELETE [id]`) & bulk (filter `role=superadmin`), jadi "pilih semua → Hapus" otomatis
  menyisakan admin. Cascade hapus anak+semua data user (FK `onDelete: cascade`).
- **Clean-slate dev dijalankan:** 3 user non-superadmin dihapus, `admin@jurnalemas.com`
  tetap. (Prod: gunakan tombol Hapus di panel admin setelah deploy.) Gate hijau.

**M12 (v1.1) — Upload foto momen milestone — ✅ SELESAI**
- Kolom additive `milestones.photoUrl` (migrasi `0005`); tipe `Milestone.photoUrl`;
  action store `setMilestonePhoto(id,url)` (set `photoUrl`+`hasPhoto`, persist `apiPatch`,
  url kosong = hapus). UI `MilestoneRow` (`goals`): saat status "bisa" → tombol "Tambah
  Foto Momen" / thumbnail (`Avatar`, lint-clean) + Ganti/Hapus, via `/api/upload`.
  Indikator teks "Ada foto" lama diganti foto nyata. Gate hijau; dev ter-migrate +
  kolom terverifikasi. Melengkapi §10.11.

**M11 (v1.1) — Persist toggle preferensi notifikasi — ✅ SELESAI**
- Lihat §10.5. `NotifTab` baru; 6 toggle persist `localStorage` (`je:notif-prefs`),
  lazy initializer (tanpa `useEffect`/warning), Switch terkontrol. Tanpa migrasi/API.
  Gate hijau (tsc/lint 15 warn lama/build). Per-perangkat; DB menyusul dgn §10.7.

**STATUS DEPLOY (per 2026-06-27):** kode M7–M10 + hotfix sudah **di-push ke `main`**
(`origin/main` = `b3c0c99`) → Vercel auto-deploy. **Aksi prod yang masih perlu dijalankan
user** (butuh `DATABASE_URL` produksi `ep-bold-river`):
- `npm run db:migrate` → terapkan `0002` (journal), `0003` (regressed), `0004` (categories),
  `0005` (milestones.photoUrl), `0006` (coach_usage), **`0007` (coach_messages)**.
- **AI Coach prod:** set `GEMINI_API_KEY` (+ `GEMINI_MODEL=gemini-2.5-flash`, opsional
  `COACH_DAILY_LIMIT`) di Vercel env. Tanpa key → `/coach` aman (pesan "belum aktif").
  - **INSIDEN 2026-06-26:** dikonfirmasi dari log prod, branch prod ada di **0003**
    (punya `regressed`, tak ada error) tapi **0004 & 0005 belum** → `GET /api/categories`
    (`relation "categories" does not exist`) & `GET /api/milestones`
    (`column "photo_url" does not exist`) 500 → `safeList` → milestone/jurnal/kategori
    tampil kosong (akun+anak tetap OK). **Fix: jalankan `db:migrate` prod.**
  - **ATURAN:** untuk milestone yang ubah skema, **migrate prod DULU, baru push** (Vercel
    auto-deploy begitu push → ada jendela kode-baru-vs-DB-lama).
- `npm run db:cdc` → rekonsiliasi anak existing ke 53 milestone.
- (opsional) set env Cloudinary di Vercel agar upload foto aktif (else 503 + fallback URL).

Sesudah M10: item v1.1 tersisa → **10.5** (persist toggle notifikasi), **10.6** (export PDF
nyata), **10.7** (generator notifikasi), **foto milestone** (migrasi + UI goals), lalu roadmap
**v1.2** (AI coach grounded).

---
Lihat `STATUS_FILES.md` untuk daftar status per-file.
