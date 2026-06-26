# Jurnal Emas Si Kecil — Frontend

Frontend untuk **Jurnal Emas Si Kecil**, platform all-in-one pemantauan tumbuh
kembang anak 0–6 tahun untuk orang tua Indonesia. Dibangun sesuai
`PRD_Jurnal_Emas_Si_Kecil_v1.0`.

> **Frontend-only.** Semua data masih _mock_ (lihat `src/lib/mock-data.ts`) dan
> dikelola di state lokal via Zustand (`src/store/app-store.ts`). Belum ada
> backend/API — seluruh interaksi (tambah/centang/hapus, ganti plan, dll.)
> berjalan sepenuhnya di sisi klien dan ter-reset saat halaman di-refresh.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** dengan design tokens sesuai sistem warna PRD (Emas, Navy, Cream, Sage…)
- **shadcn/ui** (Radix primitives) — komponen di `src/components/ui`
- **Zustand** untuk state management
- **Recharts** untuk grafik pertumbuhan
- **lucide-react** ikon, **sonner** toast

## Menjalankan

> Membutuhkan **Node.js 18.18+** (belum terpasang di mesin ini — install dulu via
> [nodejs.org](https://nodejs.org) atau `nvm install 20`).

```bash
cd jurnal-emas-web
npm install
npm run dev
```

Buka http://localhost:3000

## Struktur Halaman

| Rute            | Halaman (PRD §11.3)                                    |
| --------------- | ----------------------------------------------------- |
| `/`             | Landing page (hero, fitur, harga, testimoni, CTA)     |
| `/login` `/register` | Autentikasi (email + Google, demo)               |
| `/onboarding`   | Wizard 3 langkah setup profil anak                    |
| `/dashboard`    | Overview harian + **panduan 5 langkah** (bisa disembunyikan) |
| `/journal`      | **Jurnal Emas** — timeline kenangan (catatan + mood + tag), cari & filter |
| `/growth`       | Tumbuh Kembang — kurva BB/TB/lingkar kepala vs WHO + input pengukuran, imunisasi (IDAI) + input, gigi, tidur + catatan |
| `/goals`        | Goal & Milestone — milestone 0–6 th **dikelompokkan per fase usia** + filter domain (WHO/IDAI/Denver) |
| `/tasks`        | Task Manager — urusan sekali-jadi + mini-dashboard (progress per kategori), alert tenggat, kategori kustom |
| `/routines`     | **Rutinitas** — gabungan To-Do harian ("Hari Ini") + Habit (streak & heatmap) |
| `/children`     | Profil anak — data dasar + **Edit data anak** (grafik & milestone dipindah ke Laporan) |
| `/reports`      | Laporan — grafik WHO + **perkembangan per kategori** + milestone + export PDF (premium) |
| `/settings`     | Akun, notifikasi, subscription & billing, tampilkan-ulang panduan |

## Catatan Implementasi

- **Multi-anak**: ganti anak aktif lewat _Child Switcher_ di sidebar/topbar;
  seluruh dashboard mengikuti anak yang dipilih.
- **Freemium**: toggle plan Free/Premium di `/settings` mengubah gating fitur
  (mis. export PDF di `/reports`).
- **Responsif**: sidebar di desktop, bottom-nav + drawer di mobile (one-thumb
  friendly sesuai prinsip UX PRD).
- **Bahasa**: seluruh UI dalam Bahasa Indonesia.

## Backend (API Routes + Drizzle + Better Auth)

Backend berjalan di dalam app Next.js yang sama.

- **Auth:** Better Auth (email/password + session 30 hari, opsi Google OAuth).
  Config server `src/lib/auth.ts`, client `src/lib/auth-client.ts`, handler
  `src/app/api/auth/[...all]/route.ts`. Halaman Login/Register/Logout sudah
  terhubung. `src/middleware.ts` menjaga rute aplikasi (aktif hanya bila
  `DATABASE_URL` diisi — tanpa DB, app tetap jalan sebagai demo mock).
- **ORM:** Drizzle (PostgreSQL). Skema di `src/db/schema/` (auth + app),
  client `src/db/index.ts`, config `drizzle.config.ts`.
- **API:** Route handlers terproteksi di `src/app/api/*` untuk children, tasks,
  todos, habits, milestones, goals, growth, immunizations, teeth, sleep,
  notifications (GET list, POST, PATCH, DELETE) + `GET /api/me`. Semua query
  di-scope ke user sesi via helper `src/lib/api.ts`.

### Setup

```bash
cp .env.example .env          # isi DATABASE_URL + BETTER_AUTH_SECRET
npm run db:push               # buat tabel di Postgres (atau db:generate + db:migrate)
npm run db:seed               # data demo + akun rara@email.com / password123
npm run dev
```

Tanpa `DATABASE_URL`, aplikasi tetap bisa dibuka memakai data mock (Zustand);
gate auth & endpoint DB baru aktif setelah Postgres dikonfigurasi.

Bentuk tipe di `src/lib/types.ts` selaras dengan skema DB (PRD §9.3). Langkah
lanjutan: ganti pembacaan `mock-data.ts` di `src/store/app-store.ts` dengan
fetch ke API ini (React Query, PRD §9.1).
