# PROJECT_CONTEXT — Jurnal Emas Si Kecil

> Konteks ringkas-lengkap untuk melanjutkan pengembangan. Mencerminkan state kode
> terkini (client app + backend + admin dashboard + demo mode, semua jalan di Neon).

## 0. Mulai Cepat (baca ini dulu kalau kamu sesi/chat baru)

- **Lokasi kode:** `…/Jurnal Emas Si Kecil/Website  Jurnal Emas Si Kecil - All in one parenting tracker/jurnal-emas-web`
  (folder induk pernah memakai `:` yang merusak PATH npm — sudah di-rename jadi `-`,
  jadi `npm run dev` & `npm run db:*` kini jalan normal di IDE).
- **Status:** **client app + backend + admin dashboard + demo mode SEMUA jalan**,
  terintegrasi ke Neon & terverifikasi. Build `tsc --noEmit` **clean**. Responsif
  di mobile (diuji iPhone XR 414px).
- **Akun:**
  - User demo: `rara@email.com` / `password123`
  - Super Admin: `admin@jurnalemas.com` / `admin12345` (login di `/admin`)
- **Database:** PostgreSQL di **Neon** (cloud, ap-southeast-1). `DATABASE_URL` aktif
  di `.env` (gitignored). Tabel sudah dimigrasi + di-seed (user & admin).
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
  types.ts, who.ts (kurva WHO), domains.ts, nav.ts, utils.ts
store/app-store.ts   — Zustand: hydrate()/hydrateDemo() + aksi optimistic+persist(save gate)
middleware.ts        — auth gate (lolos demo cookie)
```
Scripts: `seed.ts`, `seed-admin.ts`, `backfill-children.ts`. Migrasi: `drizzle/`.

## 5. Model Data

**User-owned (`schema/app.ts`):** `children` · `tasks` · `todos` ·
`habits`(history jsonb) · `milestones`(per-anak) · `goals`(subGoals jsonb) ·
`growth_records` · `immunizations` · `teeth` · `sleep_logs` · `notifications` ·
`subscriptions`.

**Auth (`schema/auth.ts`):** `user` (+ `role` 'user'|'admin'|'superadmin', + `status`
'active'|'suspended', + `phone`), `session`, `account`, `verification`.

**Admin/global (`schema/admin.ts`):** `discount_codes`, `role_permissions`,
`platform_settings`, `ref_milestones`, `ref_immunizations`, `ref_teeth` (master
konten yang dikelola admin).

Anak baru otomatis di-seed: **50 milestone** (status belum), **jadwal imunisasi
IDAI**, **8 gigi susu** (lihat custom `POST /api/children`).

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

**Selesai & terverifikasi:**
- Landing page (refresh 6 fitur terbaru) + tombol "Lihat Demo Dashboard".
- Auth (login/register/logout + tombol Google), onboarding, 8 halaman app, semua modul.
- Backend CRUD user + admin, integrasi frontend↔API (hydrate + optimistic persist).
- Multi-anak + seed data referensi otomatis; migrasi + seed user/admin + backfill ke Neon.
- **Admin dashboard** (statistik, user, langganan, diskon, role, konten ref, broadcast, settings).
- **Demo mode** read-only (tidak menulis ke DB) + toast persisten non-intrusif.
- **Responsif mobile** (414px): tak ada overflow horizontal; tab Tumbuh Kembang scroll L/R;
  toast tidak menutupi bottom nav.

**Belum / placeholder:** lihat **§10**.

## 9. Langkah Berikutnya (urutan disarankan)
1. Persist sisa client-only (kategori kustom, panduan, profil user via `updateUser`).
2. Generator notifikasi + reminder otomatis (imunisasi/posyandu/deadline).
3. Export PDF laporan nyata (Puppeteer/PDFKit per PRD).
4. Pembayaran Midtrans + verifikasi email (mailer) + reset password.
5. Pendalaman admin (audit log, analytics nyata) & RBAC granular bila perlu.
6. Testing & CI/CD.

## 10. Loose Ends (Technical Debt) — Detail

Berfungsi di UI tapi belum dirapikan/di-persist. Format: lokasi → kondisi → kebutuhan.

### 10.1 Kategori task & habit kustom (client-only) — _prioritas tinggi_
- **Lokasi:** `store/app-store.ts` (`taskCategories`, `habitCategories`,
  `addTaskCategory`, `addHabitCategory`); dipakai di `task-dialog.tsx`, `habit-dialog.tsx`.
- **Sekarang:** in-memory, **hilang saat reload**, tidak per-user/DB.
- **Dibutuhkan:** tabel `categories (id,user_id,kind,name)` + `GET/POST /api/categories`;
  isi store saat `hydrate()`.

### 10.2 Streak global "12 hari" (statis)
- **Lokasi:** `store/app-store.ts` (`streak: 12`); tampil di banner `dashboard/page.tsx`.
- **Sekarang:** konstanta. (Streak **per-habit** di `habits.streak` nyata & tersimpan.)
- **Dibutuhkan:** hitung dari aktivitas harian (tabel `daily_activity`) atau derive dari
  `max(habit.streak)`; set di `hydrate()`.

### 10.3 Panel panduan dashboard (showGuide)
- **Lokasi:** `store/app-store.ts` (`showGuide`); `dashboard-guide.tsx`; toggle di settings.
- **Sekarang:** lokal, **reset `true` tiap reload**.
- **Dibutuhkan:** persist via `localStorage` atau kolom `user.preferences` (jsonb).

### 10.4 Settings — simpan profil / ubah foto / ubah sandi
- **Lokasi:** `settings/page.tsx` tab Akun → tombol hanya `toast`.
- **Dibutuhkan:** `authClient.updateUser({name,image})`, `changePassword`, wire field
  `phone` (sudah ada di schema), upload foto (lihat 10.9).

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
- **Dibutuhkan:** isi `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` di `.env`.

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

---
Lihat `STATUS_FILES.md` untuk daftar status per-file.
