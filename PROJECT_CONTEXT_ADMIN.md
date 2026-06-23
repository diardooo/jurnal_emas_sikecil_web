# PROJECT CONTEXT — Admin Dashboard

Dokumen khusus untuk **Admin Dashboard** Jurnal Emas Si Kecil. Ringkas tapi rinci.
Terakhir diperbarui: **23 Juni 2026**.

> Untuk konteks app user (orang tua), lihat `PROJECT_CONTEXT.md` & `STATUS_FILES.md`.

---

## 1. Ringkasan

Panel admin (Super Admin) untuk mengelola seluruh platform: user, anak, langganan,
konten Tumbuh Kembang (milestone/imunisasi/gigi/tidur), matriks hak akses role
Free vs Premium, kode diskon, broadcast notifikasi (in-app + WhatsApp), dan pengaturan.

- **URL:** `/admin` (satu halaman SPA, client-side routing antar-tab).
- **Stack:** identik dengan app user → Next.js 14.2 App Router + TypeScript, Tailwind
  (warna brand inline), Recharts, lucide-react, Drizzle ORM (postgres-js) → **Neon**,
  **Better Auth** (email/password, sesi 30 hari).
- **Status:** Frontend + Backend **selesai & wired ke API**. Teruji end-to-end (curl) ke Neon.
  **App LIVE** di `https://jurnal-emas-sikecil-web.vercel.app/admin`.
- **Akun:** `admin@jurnalemas.com` / *(password sudah diubah dari default `admin12345` via reset password flow)*.
- **PENTING:** User demo `rara@email.com` masih ada di DB production — **hapus via /admin → Users**.

---

## 2. Arsitektur & Alur

```
Browser /admin (page.tsx, "use client")
  └─ useSession() (Better Auth)  ──► belum login ──► <AdminLogin> (signIn.email)
       └─ probe GET /api/admin/me ──► 403 (bukan admin) ──► <AdminLogin denied>
            └─ 200 (admin) ──► <AdminShell> (sidebar + 12 halaman + modal)
                 └─ tiap halaman fetch via adminApi.* (lib/admin-client.ts)
                      └─ /api/admin/* (route handler) ──► getAdmin() guard
                           └─ Drizzle ──► Neon Postgres
```

- **Tidak pakai middleware** untuk `/admin` (biar tetap demo-browsable). Pengamanan ada
  di **lapisan API**: setiap route `/api/admin/*` dipagari `getAdmin()` → balas `403`
  bila bukan admin. Halaman client juga self-gate via `GET /api/admin/me`.
- **Data fetching:** hook kecil `useAsync(fn, deps)` → `{ data, loading, error, reload, setData }`,
  dibungkus komponen `<Async>` (loading spinner / error+retry). Mutasi → panggil API → `reload()`.

---

## 3. Auth & Role Model

- Tabel `user` (Better Auth) ditambah 2 kolom: **`role`** (`user` | `admin` | `superadmin`,
  default `user`) dan **`status`** (`active` | `suspended`, default `active`).
- Keduanya didaftarkan sebagai Better Auth `additionalFields` dengan **`input:false`**
  → tidak bisa di-set lewat signup/klien; hanya server/admin yang mengubah.
- **`getAdmin(req)`** (`src/lib/admin.ts`): ambil sesi → baca `role`+`status` **fresh dari DB**
  (jadi demote/suspend langsung berlaku) → kembalikan user bila `role ∈ {admin, superadmin}`
  dan `status === active`, selain itu `null` → handler balas `forbidden()` (403).
- **`adminResource(table)`**: factory CRUD admin-gated, mirror `resource()` di `lib/api.ts`
  tapi **tanpa filter per-user** (data global). Dipakai untuk discount + 4 tabel konten.

---

## 4. Skema Database (admin)

File: `src/db/schema/admin.ts` (migrasi `drizzle/0001_parallel_shriek.sql`, sudah di-push ke Neon).

| Tabel | Isi singkat |
|---|---|
| `discount_codes` | code (unik), type (`percent`/`fixed`), value, description, maxUsage, usedCount, expiresAt, active |
| `role_permissions` | feature, sortOrder, freeEnabled, premiumEnabled → **matriks akses Free vs Premium** |
| `platform_settings` | key (PK) → value → **key-value** (nama platform, harga, trial, WA admin, dll) |
| `ref_milestones` | master milestone (domain, title, ageMin/Max, isCritical, reference) |
| `ref_immunizations` | master vaksin (vaccine, ageLabel, ageMonths, doses, mandatory, note) |
| `ref_teeth` | master gigi susu (name, position, eruptAgeLabel, sheddAgeLabel, count) |
| `ref_sleep` | master jadwal tidur (groupName, ageLabel, totalLabel, night/nap, note) |
| `user` (+kolom) | `role`, `status` ditambahkan ke tabel Better Auth |

> Catatan: tabel `ref_*` adalah **katalog master** untuk konten Tumbuh Kembang. Instance
> per-anak tetap di `schema/app.ts` (immunizations/teeth/sleep_logs/milestones). Seeding
> anak baru saat ini masih dari `lib/child-templates.ts` (belum baca dari `ref_*` — lihat §8).

---

## 5. API Endpoints (`/api/admin/*`)

Semua dipagari `getAdmin()` → `403` bila bukan admin.

| Method | Path | Fungsi |
|---|---|---|
| GET | `/api/admin/me` | Identity probe untuk auth gate |
| GET | `/api/admin/users` | List semua user + jumlah anak + plan (filter `?q=&plan=&status=`) |
| POST | `/api/admin/users` | Buat user manual (via Better Auth signUp + subscription) |
| PATCH | `/api/admin/users/[id]` | Edit name/email/phone/role/status (+ mirror plan ke subscriptions) |
| DELETE | `/api/admin/users/[id]` | Hapus user (guard: tak bisa hapus diri sendiri) |
| POST | `/api/admin/users/bulk` | Bulk `suspend` / `activate` / `delete` (skip diri sendiri) |
| GET | `/api/admin/children` | Semua anak + data orang tua (`?userId=&q=`) |
| GET | `/api/admin/subscriptions` | Semua langganan + user (`?plan=&status=`) |
| GET | `/api/admin/stats` | Agregat: totalUsers, premium, suspended, totalChildren, newThisWeek, milestonesAchieved, tasksDone, planDistribution, growthByMonth |
| GET/PUT | `/api/admin/roles` | Baca / simpan matriks role_permissions |
| GET/POST | `/api/admin/discounts` | List / tambah kode diskon |
| PATCH/DELETE | `/api/admin/discounts/[id]` | Edit (toggle aktif) / hapus diskon |
| GET/POST | `/api/admin/content/{milestones,immunizations,teeth,sleep}` | List / tambah konten |
| PATCH/DELETE | `…/content/{kind}/[id]` | Edit / hapus konten |
| POST | `/api/admin/broadcast` | Kirim notifikasi in-app ke target (`all`/`free`/`premium`/`ids`) → tulis ke tabel `notifications`, balikkan no HP untuk WA |
| GET/PUT | `/api/admin/settings` | Baca / upsert platform_settings (key-value) |

Klien terketik: **`adminApi.*`** di `src/lib/admin-client.ts` (mirror `api-client.ts`,
auth via cookie same-origin; lempar error pada 401/403).

---

## 6. Frontend (`src/app/admin/page.tsx`, single-file ~1.3k baris)

**12 halaman (tab):**
`overview` · `users` · `children` · `subscriptions` · `milestones` · `imunisasi` ·
`gigi` · `tidur` · `notifications` · `analytics` · `roles` · `settings`.

**6 modal:** `user-detail`, `edit-user`, `add-user`, `add-content` (kind-aware:
milestone/imunisasi/gigi/tidur), `broadcast` (in-app), `wa-broadcast` (deep-link `wa.me`).

**Fitur yang sudah live (tulis ke DB):**
- User: list/cari/filter, checkbox + bulk suspend/activate, edit, tambah, suspend toggle, chat WA.
- Data Anak: list semua anak + orang tua, chat WA orang tua.
- Subscription: list semua langganan.
- Role: matriks toggle Free/Premium → **Simpan** (persist).
- Diskon: tambah / toggle aktif / hapus.
- Konten (4 modul): list + tambah + hapus.
- Pengaturan: edit & simpan (nama platform, harga, trial, WA admin).
- Broadcast: in-app (nyata) + WhatsApp (buka chat massal).

**Komponen kunci:** `AdminLogin` (Better Auth), `AdminShell`, `AdminSidebar` (3 grup nav +
identitas admin + sign-out), `AdminTopbar`, util `useAsync`/`<Async>`, `colorOf`, `fmtDate`,
`ageFromDob`, `waLink`.

---

## 7. Cara Menjalankan

```bash
# 1. Migrasi sudah di Neon. Jika DB fresh:  (path ada ":" → panggil bin langsung)
node ./node_modules/drizzle-kit/bin.cjs push            # atau: npm run db:push

# 2. Seed data admin (akun + role matrix + diskon + konten ref + settings)
npm run db:seed:admin
#   → login: admin@jurnalemas.com / admin12345  (role superadmin)

# 3. Jalankan app
npm run dev                                             # http://localhost:3000/admin

# 4. (opsional) Drizzle Studio — GUI DB
npm run db:studio                                       # https://local.drizzle.studio (proxy :4983)
#   Catatan: Brave/Chrome bisa blok localhost → izinkan "Local network access" / matikan Brave Shields.
```

> **Lingkungan:** Node v24 (nvm) sudah terpasang. **Belum** ada Docker/Postgres lokal →
> pakai **Neon** (ap-southeast-1). `DATABASE_URL` ada di `.env` (gitignored).

---

## 8. Yang Masih Mock / Belum (next steps)

| Item | Status | Catatan |
|---|---|---|
| Grafik Analytics: revenue, retensi, usage | ⚠️ data demo | Belum ada endpoint agregat; ditandai "data demo" di UI |
| Daftar template di halaman Notifikasi | ⚠️ contoh | Hanya ilustrasi; broadcast-nya nyata |
| Edit konten (milestone/imunisasi/gigi/tidur) | ⚠️ sebagian | Live: list + tambah + hapus. **Edit inline belum** (API PATCH siap) |
| Tombol Export CSV/PDF | ❌ mock | Belum ada generator |
| Proteksi `/admin` di middleware | ⚠️ desain | Saat ini self-gate di client + guard API. Hardening: tambah ke middleware |
| Integrasi Midtrans (pembayaran) | ❌ | subscription baru kolom DB |
| WhatsApp Business API resmi | ❌ | Sekarang broadcast manual via `wa.me` deep-link |
| Mailer (reset password, dll) | ❌ mock | Tombol hanya toast |
| Seeding anak baru dari tabel `ref_*` | ❌ | Masih dari `lib/child-templates.ts` |
| Generator reminder otomatis (imunisasi/deadline) | ❌ | Belum |

---

## 9. Daftar File — Selesai vs Belum

### ✅ Selesai (admin)

**Frontend**
- ✅ `src/app/admin/layout.tsx` — metadata + noindex
- ✅ `src/app/admin/page.tsx` — seluruh dashboard (12 halaman, 6 modal, auth gate, wired API)

**Lib & Schema**
- ✅ `src/lib/admin.ts` — `getAdmin()`, `forbidden()`, `adminResource()`
- ✅ `src/lib/admin-client.ts` — `adminApi.*` + tipe (AdminUser/Child/Stats/RolePermission/DiscountCode/Subscription/Ref*)
- ✅ `src/db/schema/admin.ts` — 7 tabel admin
- ✅ `src/db/schema/auth.ts` — kolom `role` + `status` (diperluas)
- ✅ `src/lib/auth.ts` — additionalFields role/status (`input:false`)
- ✅ `drizzle/0001_parallel_shriek.sql` — migrasi (additive, sudah di-push)

**API routes** (`src/app/api/admin/`)
- ✅ `me/route.ts`
- ✅ `users/route.ts`, `users/[id]/route.ts`, `users/bulk/route.ts`
- ✅ `children/route.ts`
- ✅ `subscriptions/route.ts`
- ✅ `stats/route.ts`
- ✅ `roles/route.ts`
- ✅ `discounts/route.ts`, `discounts/[id]/route.ts`
- ✅ `content/milestones/route.ts` (+ `[id]`)
- ✅ `content/immunizations/route.ts` (+ `[id]`)
- ✅ `content/teeth/route.ts` (+ `[id]`)
- ✅ `content/sleep/route.ts` (+ `[id]`)
- ✅ `broadcast/route.ts`
- ✅ `settings/route.ts`

**Scripts & Docs**
- ✅ `scripts/seed-admin.ts` (`npm run db:seed:admin`)
- ✅ `PROJECT_CONTEXT_ADMIN.md` (dokumen ini)
- ✅ `STATUS_FILES.md` — bagian Admin Dashboard sudah diperbarui

### ❌ / ⚠️ Belum dibuat (admin)

- ⚠️ Modal **Edit konten** (PATCH) untuk milestone/imunisasi/gigi/tidur (API siap, UI belum)
- ❌ Endpoint & grafik **analytics nyata** (revenue/retensi/usage) — ganti data demo
- ❌ Endpoint **list notifikasi terkirim** (riwayat broadcast nyata)
- ❌ **Export CSV/PDF** (user, transaksi, laporan)
- ❌ **Middleware** proteksi `/admin` (hardening)
- ❌ Integrasi **Midtrans**, **WhatsApp Business API**, **Mailer/Resend**
- ❌ Wiring seeding anak baru ke tabel `ref_*`
- ❌ **Testing & CI** untuk endpoint admin
