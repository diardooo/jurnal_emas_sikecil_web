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

### 10.8 Pembayaran Midtrans (subscription) — ✅ SELESAI (M22), uji live butuh key
- **Flow nyata:** `lib/midtrans.ts` (Snap REST, env-gated, sandbox default) +
  `POST /api/payment/snap` (checkout → token/redirectUrl, catat sub `pending`) +
  `POST /api/payment/notify` (webhook: verifikasi signature sha512 → premium/active).
  Kosong key → 503 → frontend fallback "mode demo trial".
- **Korektnes M22:** plan (bulanan/tahunan) di-encode ke `orderId` (`JES-<plan>-<ts>-<uid>`)
  & di-parse webhook (fix bug tahunan selalu 30h); cek `fraud_status` utk `capture`;
  expiry **idempotent** (anchor ke settlement pertama → webhook ganda tak menumpuk hari);
  gagal/expire **tak men-downgrade** premium yang masih aktif (hanya bersihkan `pending`).
  Frontend: tombol Bulanan/Tahunan + handle balik `?paid=1` (re-hydrate). **Tanpa migrasi.**
- **Histori & revenue (M23):** tabel `transactions` (0008) — `snap` insert `pending`,
  `notify` flip `paid`/`failed`/`expired` (+`paymentType`,`paidAt`), `order_id` unique
  (upsert idempotent). Admin Analytics "Revenue Bulanan" kini **rupiah nyata** dari
  `sum(amount) where status=paid` (ganti proxy subsByMonth M21).
- **Rekonsiliasi (M24):** webhook bisa hilang/telat → `getTransactionStatus` (Core API
  `GET /v2/{order}/status`) + `POST /api/payment/status` (user-scoped) cek status saat
  user balik `?paid=1` lalu settle via helper bersama `lib/payment-apply.ts`
  (`applyOrderOutcome`, dipakai webhook & reconcile — tak bisa drift). 404 = body
  `status_code:"404"` (HTTP 200) → null.
- **Ops uji live (kamu):** isi `MIDTRANS_SERVER_KEY`/`CLIENT_KEY` (Sandbox) di `.env` &
  Vercel; set Payment Notification URL Midtrans → `https://<domain>/api/payment/notify`.
  **Sandbox AKTIF di prod** (Merchant G058364987); kartu tes `4811 1111 1111 1114`.

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

### 10.12 Admin — ✅ ANALITIK NYATA (M21); sisa pendalaman
- **Lokasi:** `app/admin/page.tsx` + `api/admin/stats`.
- **Sekarang:** CRUD user/langganan/diskon/konten/role/settings berfungsi; **hapus user**
  (per-baris + bulk) sudah ter-wire di UI (M13) dgn guard: tak bisa hapus diri sendiri
  **maupun superadmin** (aman untuk "pilih semua → Hapus"). **Tab Analytics kini 100% data
  nyata (M21):** 3 grafik demo (RETENTION/USAGE/REVENUE konstan) dihapus → diganti
  `moduleUsage` (adopsi: `countDistinct(userId)` per modul ÷ total user), `activation`
  (funnel Registrasi→Tambah Anak→Catat Pertumbuhan→Tandai Milestone→Aktif 7 hari), dan
  `revenueByMonth` (revenue rupiah nyata dari `transactions` terbayar — M23; sebelumnya
  proxy `subsByMonth` M21).
  Semua agregat read-only, **tanpa migrasi**.
- **Dibutuhkan (tersisa):** audit log, RBAC granular per-permission; revenue transaksi nyata
  menyusul Midtrans (10.8).

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

### Sesi 2026-06-28 — Landing world-class + polish in-app (M37–M43)

> Semua commit di bawah **belum di-push** (user yang push & deploy). Semua **tanpa
> migrasi DB** (murni frontend). Gerbang tiap commit hijau (tsc · lint 0 error · build).

**M43 — Galeri foto jurnal + lightbox swipe — ✅ SELESAI** (`65dcc20`)
- **Masalah:** foto jurnal menumpuk vertikal full-width; klik = buka gambar mentah di tab baru.
- **Fix:** `components/app/photo-gallery.tsx` — grid adaptif (1/2/3 kolom sesuai jumlah,
  overlay **"+N"** bila >6) + **lightbox full-screen** via portal: swipe (touch), tombol
  panah, keyboard ←/→, strip thumbnail, counter, Esc/backdrop tutup, kunci scroll body.
  Pakai `<img>` (tahan URL lama, `eslint-disable` agar lint bersih). Ganti blok media lama
  di `journal/page.tsx` (hapus import Avatar yg tak terpakai).

**M42 — Nav mobile konsisten + panduan responsif + nama anak demo — ✅ SELESAI** (`bfdb2c3`)
- **Bottom nav vs drawer beda total** → bottom nav = 4 primary (Beranda/Tumbuh/Milestone/
  Task) + tombol **"Lainnya"** yang membuka drawer yang sama (state dibagi via
  `store/ui-store.ts`); "Lainnya" aktif saat di halaman non-primary. Topbar pakai store ini.
- **Kartu panduan** footer tergencet di HP → susun vertikal (`flex-col sm:flex-row`).
- **Anak demo** `mock-data` c1 → **Kyara Zivanya Adinegara**, lahir 2025-02-10, P; konten
  demo (jurnal/notif/goal) yang menyebut "Bintang" disamakan ke "Kyara".

**M41 — Fix React key Growth (demo) — ✅ SELESAI** (`564fe09`)
- `mockGrowth` tanpa `id` → `key={r.id}` undefined (warning dev). Fallback
  `key={r.id ?? \`${r.ageMonths}-${r.date ?? i}\`}`. Tab lain (imun/gigi) sudah ber-id.

**M40 — Hero simetris (deck overlap) + CTA mobile full-width — ✅ SELESAI** (`5d9cedd`,`5cbed89`)
- 3 kartu hero dulu vertikal → terlalu tinggi/asimetris. Jadi **deck bertumpuk**: tiap
  kartu `-mt-24` + lebar bertingkat (94/97/100%) + z-index, menutupi sebagian kartu di
  belakang (info tetap utuh). In-flow → responsif & mulus di HP. 2 chip mengambang ke sudut.
- Tombol Magnetic (`inline-block`) bikin CTA primary sempit di HP → `w-full sm:w-auto`.

**M39 — Landing world-class redesign — ✅ SELESAI** (`e7bd3c6`)
- Upgrade premium **tanpa dependency baru** (no Framer Motion), `/` tetap statis.
- `components/marketing/fx.tsx`: `Reveal` (scroll), `CountUp`, `Magnetic`, `ScrollProgress`,
  `SpotlightCard` — GPU-only, IntersectionObserver, reduced-motion aware.
- Design system: gradient-text emas, glass, noise, marquee mask, keyframes blob/float/
  marquee/gradient; `aurora.tsx` (blob ambient).
- Header transparan→solid + scroll-spy. Hero parallax tilt (`hero-preview.tsx`).
- Seksi baru: marquee kredibilitas, stat band count-up, grid fitur spotlight, demo
  browser-frame, timeline 3 langkah, perbandingan manual-vs-app, FAQ accordion (`faq.tsx`),
  CTA aurora. + OpenGraph/Twitter metadata + JSON-LD SoftwareApplication.
- **Catatan:** dark-mode landing belum (seksi pakai warna brand tetap); ditunda agar tak setengah jadi.

**M38 — Kartu laporan hero + caption benefit + admin tables mobile-safe — ✅ SELESAI** (`72a82b9`)
- Hero dapat kartu ilustrasi **Laporan Perkembangan** (PDF/share, bar per domain).
- Tiap kartu ilustrasi diberi footer **caption benefit** (poin plus).
- 11 tabel admin dulu di dalam `Card overflow-hidden` (terpotong di HP) → dibungkus
  `overflow-x-auto` (scroll horizontal).

**M37 — Hero illustration: grafik pertumbuhan + kalender jadwal — ✅ SELESAI** (`5582a5b`)
- Gambar hero abstrak diganti komposit feature-true: profil anak + **grafik z-score WHO**
  + ringkasan milestone, dan **kartu kalender** dengan jadwal (imunisasi/posyandu/cek
  milestone) + chip Pendamping AI.

**M36 — Footer landing: link nyata + halaman legal — ✅ SELESAI**
- **Masalah:** footer punya 6 link mati `href="#"` (Tentang/Blog/Karier/Pusat Bantuan/
  Kontak/Privasi) + "Dashboard" (redirect login).
- **Fix:** restruktur jadi 3 kolom semua-nyata — Produk (#fitur/#cara-kerja/#harga),
  Mulai (/register, /login, /demo), Legal & Bantuan (/privacy, /terms, mailto kontak).
  Hapus link tak penting. Buat **halaman publik `/privacy` & `/terms`** nyata (konten
  jujur: data anak, Neon/Cloudinary/Gemini/Midtrans/Resend, hak hapus akun, bukan nasihat
  medis, paket sekali-bayar) + `LegalShell` (header+footer konsisten). Header anchor
  diverifikasi semua ada. **Tanpa migrasi.**
- **Catatan:** kontak pakai `mailto:halo@jurnalemas.com` — user perlu pastikan inbox ada.
- Gerbang: tsc bersih · lint 0 error · build sukses.

**M35 — Admin: reset password jadi NYATA (de-mock) — ✅ SELESAI**
- **Bug:** tombol "Reset Password" di Detail User = `showToast("📧 (mock) reset password")`.
- **Fix:** panggil `authClient.requestPasswordReset({ email, redirectTo:"/reset-password" })`
  → kirim email reset nyata (via Resend, sesuai flow forgot-password). `BtnGhost` dukung
  `disabled`. Audit ulang admin: notification history (recipients/read/openRate) ternyata
  **sudah nyata** (agregat grup). Tak ada stub lain tersisa di admin. Tanpa migrasi.
- Gerbang: tsc bersih · lint 0 error · build sukses.

**M34 — Matriks akses admin jadi NYATA (read-only, sumber kode) — ✅ SELESAI**
- **Masalah:** tab "Role & Akses" punya toggle Free/Premium yang **tak berpengaruh**
  (display-only) DAN isinya **salah** (klaim Imunisasi/Gigi/Tidur/notifikasi = premium,
  padahal gratis). Kontrol admin palsu + menyesatkan.
- **Solusi:** `lib/gating.ts` `ACCESS_POLICY` = sumber kebenaran tunggal yang mencerminkan
  enforcement nyata (M28). Tab admin dirombak jadi **read-only** (✓/🔒, + catatan kuota:
  Free 1 anak/3 coach, Premium tak terbatas/penuh) yang membaca `ACCESS_POLICY` — tak bisa
  drift dari kode. Toggle & "Simpan" dihapus.
- API `role_permissions` (PUT) kini tak dipakai UI (dibiarkan, harmless). Tanpa migrasi.
- Gerbang: tsc bersih · lint 0 error (14 warning) · build sukses.

**M32 — Bagikan laporan via link publik (de-stub) — ✅ SELESAI**
- **Bug diperbaiki:** tombol "Bagikan via Link" hanya `toast` palsu (tak buat link).
- **DB (migrasi 0010, additive):** `report_shares(id=token, userId, childId→cascade,
  fromDate, toDate, expiresAt, createdAt)`.
- **API:** `POST /api/reports/share` (premium-gated, buat token + expiry 30 hari);
  `GET /api/public/report/[token]` (**publik tanpa auth** — 404 tak ada, 410 expired;
  expose hanya data laporan: anak, growth, milestone tercapai, imunisasi).
- **Halaman publik `/r/[token]`** read-only (header anak+usia, ringkasan, tabel
  pertumbuhan, milestone tercapai, disclaimer medis, CTA). Di luar grup (app) →
  middleware allowlist tak melindungi → publik.
- **UI:** reports "Bagikan via Link" → buat token + salin URL ke clipboard.
- **Verifikasi:** roundtrip token dev PASS. Gerbang hijau.
- **⚠️ Deploy (schema change):** migrasi **0010** ke prod **SEBELUM push**.

**M31 — Fix notifikasi: tipe broadcast tak crash bell + empty state — ✅ SELESAI**
- `iconFor[n.type]` tanpa fallback → broadcast admin (type non-standar) bikin `<Icon>`
  undefined → dropdown notifikasi user crash. Perlebar `AppNotification.type`, fallback
  ikon `Bell`, + empty state. Tanpa migrasi.

**M30 — Panel langganan Premium sesuai model sekali-bayar — ✅ SELESAI**
- **Bug diperbaiki:** tombol "Batalkan Langganan" memanggil `setPlan("free")` → mencabut
  premium yang sudah dibayar seketika. Pembayaran kita sekali-bayar (bukan recurring),
  jadi "batalkan" tak relevan.
- **Sekarang:** panel premium tampil masa aktif (`hingga <tanggal>`), info "sekali bayar,
  tidak diperpanjang otomatis", + tombol **Perpanjang 1 Bulan / 1 Tahun** (`startCheckout`,
  masa aktif baru dari tanggal bayar — sesuai anchoring M22). Hapus "Kelola Pembayaran"
  (stub) & "Batalkan Langganan" (destruktif). Client-only, **tanpa migrasi**.
- Gerbang: tsc bersih · lint 0 error · build sukses.

**M29 — Gating Premium terlihat (lock hint di UI) — ✅ SELESAI**
- Tombol foto **jurnal** (journal-dialog) & **milestone** (goals MilestoneRow) di akun Free
  kini tampil **terkunci** (ikon Lock + label "Premium") dan klik → toast upsell ke
  /settings, bukan baru error setelah upload. Premium → normal.
- Murni client/UX (lengkapi M28). Gerbang: tsc bersih · lint 0 error · build sukses.
  **Tanpa migrasi.**

**M28 — Gating Premium (free vs premium enforcement) — ✅ SELESAI**
- **Server (sumber kebenaran, expiry-aware via `effectivePlan`):** `lib/plan.ts`
  `getUserPlan`/`isPremium`/`premiumRequired(403)`; `lib/gating.ts` konstanta
  (`FREE_CHILD_LIMIT=1`, `FREE_COACH_DAILY_LIMIT=3`).
  - `/api/upload` → gated per `purpose`: **jurnal & milestone = Premium** (403);
    **profil & anak = gratis** (`PREMIUM_PURPOSES={journal,milestone}`).
  - `/api/children` POST → Free maks 1 anak → 403 premiumRequired.
  - `/api/coach` → kuota harian: Free 3, Premium `COACH_DAILY_LIMIT` (20); 429 ber-flag.
- **Client UX:** reports Export PDF **sudah** ter-gate (upsell); children "Tambah Anak"
  pre-check + upsell toast→/settings; `addChild` rollback optimistic insert saat 403
  (tak ada anak hantu); call-site upload sudah tampilkan `data.error` → pesan premium muncul.
- **Verifikasi:** `getUserPlan` + child-count diuji ke DB dev (free+1 anak→BLOCK, premium→allow).
  Gerbang: tsc bersih · lint 0 error · build sukses. **Tanpa migrasi.**
- **Catatan:** matriks `role_permissions` di admin masih display-only (belum jadi sumber
  gating); gating saat ini di kode. Wiring matriks→gating bisa milestone lanjutan.

**M27 (10.12) — Audit log admin — ✅ SELESAI**
- **DB (migrasi 0009, additive):** `admin_audit_log(id, actorId, actorEmail[snapshot],
  action, targetType, targetId, summary, meta:jsonb, createdAt)`.
- **Helper:** `lib/admin-audit.ts` `logAdmin(actor, {action,summary,targetType,targetId,
  meta})` — best-effort (gagal log ≠ gagal aksi).
- **Ter-wire:** `users/[id]` PATCH (`user.update` + field berubah/plan) & DELETE
  (`user.delete`); `users/bulk` (`users.bulk` suspend/activate/delete + count);
  `broadcast` (`broadcast.send` target+count); `roles` PUT (`roles.update`).
- **Baca + UI:** `GET /api/admin/audit` (100 terbaru) + panel "Riwayat Aktivitas Admin"
  di Settings (tabel waktu/admin/aksi/detail, refresh).
- **Verifikasi:** roundtrip DB dev PASS (2 entri logged & terbaca, cleanup). Gerbang: tsc
  bersih · lint 0 error · build sukses.
- **⚠️ Deploy (schema change):** migrasi **0009** harus diterapkan ke prod **SEBELUM push**
  (`DATABASE_URL="<PROD-DIRECT>" npm run db:migrate`) — tanpa itu semua aksi admin yg
  memanggil `logAdmin` tetap jalan (best-effort catch) TAPI panel audit & insert akan
  error di server log; aman tapi kotor. Idealnya migrate dulu.

**M26 (10.12) — Status integrasi admin jadi NYATA — ✅ SELESAI**
- **Masalah:** panel "Integrasi API" (Settings) & kartu "Integrasi Midtrans" (Subscription)
  hardcoded "Belum aktif/Perlu Konfigurasi" — padahal Midtrans/Cloudinary/Resend/Google/
  Gemini sudah aktif.
- **Solusi:** `api/admin/stats` tambah `integrations` (boolean dari env server, tanpa
  bocorkan secret): midtrans/cloudinary/resend/googleOAuth/gemini. UI: panel render
  3-state (Aktif hijau / Belum aktif merah / Manual oranye utk WhatsApp wa.me); kartu
  Subscription pakai `integrations.midtrans` nyata. PageSettings & PageSubscriptions fetch
  `stats`.
- **Verifikasi:** kelima integrasi lokal = true. Gerbang: tsc bersih · lint 0 error ·
  build sukses. **Tanpa migrasi.**

**M25 (10.8) — Enforce expiry langganan — ✅ SELESAI**
- **Masalah:** `plan` dibaca mentah dari DB → premium tak pernah turun walau `expiresAt`
  lewat.
- **Solusi:** `lib/subscription.ts` `isPremiumActive`/`effectivePlan` (expiry-aware;
  `expiresAt=null` = lifetime/comp → tetap aktif). `getMe` kembalikan effective plan +
  **lazy-downgrade** baris premium kedaluwarsa ke free (sekali, biar admin/revenue akurat).
  Admin stats `premium`/MRR kini hitung effective (`plan=premium AND (expiresAt NULL OR
  > now)`). Settings tampil tanggal `expiresAt` asli (ganti hardcode "19 Jul 2026").
- **Store:** `subscriptionExpiresAt` + `MeResponse.subscription.expiresAt`.
- **Verifikasi:** unit test helper 8/8 PASS. Gerbang: tsc bersih · lint 0 error · build
  sukses. **Tanpa migrasi.**

**M24 (10.8) — Rekonsiliasi status bayar (anti webhook-hilang) — ✅ SELESAI**
- **Masalah nyata (ditemukan saat uji prod):** kartu kredit sukses di Midtrans tapi
  subscription tetap `pending` — webhook settlement tak terproses. Andalan webhook saja
  rapuh (notifikasi bisa hilang/telat → user yg sudah bayar nyangkut).
- **Solusi:** `lib/midtrans.ts` `getTransactionStatus` (Core API `GET /v2/{order}/status`,
  host `api.*` bukan `app.*`); `lib/payment-apply.ts` `applyOrderOutcome` (logika settle
  diekstrak — dipakai webhook & reconcile bersama); `POST /api/payment/status`
  (user-scoped: hanya rekonsiliasi langganan milik caller). Frontend `?paid=1` →
  panggil `/api/payment/status` → `hydrate()` → toast "Premium aktif" bila ter-upgrade.
- **Refactor:** `notify/route.ts` kini ramping, pakai `applyOrderOutcome` yg sama.
- **Bugfix:** order tak dikenal = Midtrans balas HTTP 200 + body `status_code:"404"` →
  `getTransactionStatus` kembalikan null (bukan baca `res.status`).
- **Verifikasi live (read-only):** status order asli = `capture/accept`; order palsu →
  null. Gerbang: tsc bersih · lint 0 error · build sukses. **Tanpa migrasi.**

**M23 (10.8) — Tabel transactions: histori bayar + revenue rupiah nyata — ✅ SELESAI**
- **DB (migrasi 0008, additive):** `transactions(id, userId→cascade, orderId UNIQUE,
  plan, amount:int, status[pending|paid|failed|expired], paymentType, paidAt, createdAt)`.
- **Wire:** `snap` insert baris `pending` saat checkout; `notify` set `paid`/`failed`/
  `expired` + `paymentType` + `paidAt` (by orderId, idempotent).
- **Admin:** stats `revenueByMonth` = `sum(amount) where status=paid` group bln(paidAt) →
  kartu "Revenue Bulanan" rupiah nyata (ganti `subsByMonth` proxy M21); empty-state bila
  belum ada transaksi terbayar.
- **Verifikasi:** roundtrip DB dev PASS (pending→paid, agregat Rp399k/1 tx, unique
  order_id enforced, cleanup). Gerbang: tsc bersih · lint 0 error · build sukses.
- **⚠️ Catatan deploy (schema change):** migrasi **0008** harus diterapkan ke **prod
  SEBELUM push** (`DATABASE_URL="<PROD-DIRECT>" npm run db:migrate`) — Vercel auto-deploy,
  tanpa tabel ini `snap`/`notify`/admin-stats akan 500.

**M22 (10.8) — Midtrans: flow pembayaran benar end-to-end — ✅ SELESAI**
- **Temuan:** Midtrans sudah sebagian ada (snap/notify/lib) tapi punya bug korektnes:
  (a) deteksi paket tahunan baca `body.item_id` yg tak ada di webhook → semua 30 hari;
  (b) gagal bayar set `plan:free` → bisa downgrade premium aktif; (c) tak idempotent /
  tak cek `fraud_status`.
- **Fix (additive, tanpa migrasi):** `lib/midtrans.ts` `makeOrderId`/`planFromOrderId`/
  `planDurationDays` (encode plan ke orderId) + dukung `callbacks.finish`; `snap` pakai
  orderId ber-plan + finishUrl `/settings?paid=1`; `notify` ambil plan dari orderId,
  `capture` butuh `fraud_status=accept`, expiry idempotent (anchor settlement pertama),
  gagal hanya bersihkan `pending` (tak downgrade premium aktif).
- **Frontend:** tombol Bulanan/Tahunan (`startCheckout`), handle `?paid=1` → `hydrate()`.
- **Verifikasi:** skrip tsx 19/19 PASS (orderId roundtrip, signature sha512, mapping
  status, idempotensi expiry). Gerbang: tsc bersih · lint 0 error · build sukses.
- **Catatan:** read/write existing tables only → **tak perlu migrasi prod**, aman push.

**M21 (10.12) — Admin Analytics: de-mock → data nyata — ✅ SELESAI**
- **Masalah:** tab Analytics punya 3 grafik dgn konstanta hardcoded (`RETENTION_DATA`,
  `USAGE_DATA`, `REVENUE_DATA`) — tampak nyata tapi palsu.
- **Backend (`api/admin/stats`):** tambah 3 agregat read-only (tanpa migrasi):
  `moduleUsage` (`countDistinct(userId)` per tabel: children/growth/milestones/tasks/
  habits/journal/immun ÷ total user → % adopsi, sorted), `activation` (funnel berurutan
  Registrasi→Tambah Anak→Catat Pertumbuhan→Tandai Milestone[status=bisa]→Aktif 7 hari),
  `subsByMonth` (premium baru/bln dari `subscriptions.createdAt`, `plan=premium`).
- **Frontend:** Retensi→**Funnel Aktivasi**, Modul Paling Digunakan→adopsi nyata,
  Revenue Harian→**Langganan Premium Baru/Bulan** (revenue transaksi nyata menyusul
  Midtrans 10.8). Konstanta demo + label "data demo" dihapus. Tooltip tampil %+jumlah user.
- **Catatan deploy:** murni query baca → **tak perlu migrasi prod**, aman push langsung.
- Gerbang: tsc bersih · lint 0 error (15 warning pre-existing) · build sukses.

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
