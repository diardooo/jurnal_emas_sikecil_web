# STATUS FILE — Jurnal Emas Si Kecil

Legenda: ✅ selesai & berfungsi · ⚠️ ada tapi sebagian placeholder/mock · ❌ belum dibuat

## ✅ Konfigurasi & Tooling
| File | Status |
|---|---|
| package.json, tsconfig.json, next.config.mjs | ✅ (scripts: db:generate/push/migrate/studio/seed/seed:admin) |
| tailwind.config.ts, postcss.config.mjs, components.json | ✅ |
| .eslintrc.json, .gitignore, .env.example | ✅ |
| .env (DATABASE_URL Neon aktif, gitignored) | ✅ |
| drizzle.config.ts, drizzle/*.sql (migrasi) | ✅ (sudah di-apply) |
| README.md, PROJECT_CONTEXT.md, STATUS_FILES.md | ✅ |

## ✅ Database & Skema
| File | Status |
|---|---|
| src/db/index.ts | ✅ client Drizzle (postgres-js) |
| src/db/schema/auth.ts | ✅ user(+role,+status,+phone)/session/account/verification |
| src/db/schema/app.ts | ✅ 12 tabel domain (user-owned) |
| src/db/schema/admin.ts | ✅ discount_codes, role_permissions, platform_settings, ref_milestones/immunizations/teeth |
| src/db/schema/index.ts | ✅ |

## ✅ Backend — Auth & API User
| File | Status |
|---|---|
| src/lib/auth.ts (server) | ✅ Better Auth (email/pass; Google opsional) |
| src/lib/auth-client.ts | ✅ |
| src/lib/api.ts | ✅ resource() factory + getUser + guard |
| src/lib/api-client.ts | ✅ apiGet/Post/Patch/Delete, getMe, groupByChild |
| src/lib/child-templates.ts | ✅ seed referensi anak baru |
| src/middleware.ts | ✅ auth gate (lolos cookie demo) |
| src/app/api/auth/[...all]/route.ts, api/me/route.ts | ✅ |
| src/app/api/children/route.ts | ✅ custom POST (seed referensi) + GET |
| api/{tasks,todos,habits,milestones,goals,growth,immunizations,teeth,sleep,notifications,subscriptions,children}/* | ✅ CRUD generik |

## ✅ Backend — Admin
| File | Status |
|---|---|
| src/lib/admin.ts | ✅ getAdmin() (role gate, baca fresh dari DB) + adminResource() |
| src/lib/admin-client.ts | ✅ |
| src/app/api/admin/{stats,users,users/[id],users/bulk}/route.ts | ✅ stats kini + mrr & contentCounts |
| src/app/api/admin/{subscriptions,discounts,discounts/[id],roles,settings,broadcast,children,me,notifications}/route.ts | ✅ (notifications = riwayat broadcast) |
| src/app/api/admin/content/{milestones,immunizations,teeth,sleep}/* | ✅ CRUD konten referensi (list/add/edit/hapus) |

## ✅ Backend — Integrasi (env-gated, REST, tanpa SDK baru)
| File | Status |
|---|---|
| src/lib/mailer.ts | ✅ Resend REST; fallback log ke console (reset password jalan di dev) |
| src/lib/cloudinary.ts + src/app/api/upload/route.ts | ✅ signed upload; 503 jika belum dikonfigurasi |
| src/lib/midtrans.ts + src/app/api/payment/{snap,notify}/route.ts | ✅ Snap + webhook (verifikasi signature); 503 jika belum dikonfigurasi |
| src/lib/auth.ts (sendResetPassword) | ✅ wired ke mailer |
| INTEGRATIONS_SETUP.md | ✅ panduan kredensial (Resend/Cloudinary/Google/Midtrans/Sentry) |
| .env.example, .github/workflows/ci.yml | ✅ lengkap (lint+typecheck+build) |

## ✅ Scripts
| File | Status |
|---|---|
| scripts/seed.ts | ✅ dijalankan (user demo + data) |
| scripts/seed-admin.ts | ✅ dijalankan (super admin + role + diskon + konten ref + settings) |
| scripts/backfill-children.ts | ✅ dijalankan (lengkapi anak lama) |

## ✅ State, Tipe, Util
| File | Status |
|---|---|
| src/store/app-store.ts | ✅ hydrate()/hydrateDemo() + aksi optimistic+persist (save() gate demo); milestones per-anak |
| src/lib/types.ts | ✅ |
| src/lib/mock-data.ts | ✅ master data + template (dipakai seed & demo) |
| src/lib/who.ts, domains.ts, nav.ts, utils.ts | ✅ |

## ✅ Halaman — User App & Publik
| File | Status |
|---|---|
| src/app/layout.tsx, globals.css | ✅ (globals: toast lift di mobile) |
| src/app/page.tsx (landing) | ✅ 6 kartu fitur terbaru + tombol /demo |
| src/app/(auth)/login, register | ✅ terhubung Better Auth |
| src/app/onboarding/page.tsx | ✅ |
| src/app/demo/page.tsx | ✅ set cookie demo + hydrateDemo → /dashboard |
| src/app/(app)/layout.tsx | ✅ shell + StoreHydrator + DemoBanner |
| src/app/(app)/dashboard/page.tsx | ✅ + panduan 5 langkah |
| src/app/(app)/growth/page.tsx | ✅ tab scroll-horizontal di mobile |
| src/app/(app)/goals/page.tsx | ✅ milestone per-anak, per fase usia |
| src/app/(app)/tasks/page.tsx | ✅ list/kanban/kalender + mini-dashboard |
| src/app/(app)/routines/page.tsx | ✅ gabungan To-Do + Habit |
| src/app/(app)/children/page.tsx | ✅ + Edit data anak |
| src/app/(app)/reports/page.tsx | ⚠️ tampil OK; **export PDF masih mock** (butuh lib) |
| src/app/(app)/settings/page.tsx | ✅ simpan profil (nama/hp), upload foto, ganti sandi (Better Auth), checkout Midtrans; toggle notif kosmetik |
| src/app/(auth)/forgot-password, reset-password | ✅ "Lupa sandi" via Better Auth + mailer |

## ✅ Halaman — Admin
| File | Status |
|---|---|
| src/app/admin/layout.tsx | ✅ |
| src/app/admin/page.tsx | ✅ wired ke API (login by role; CRUD user/langganan/diskon/role/konten **+edit**/settings/broadcast); export CSV nyata; riwayat broadcast & MRR nyata; sisa grafik retensi/usage ditandai "data demo" |

## ✅ Komponen
| Grup | Status |
|---|---|
| components/ui/* (primitives shadcn; Tabs kini scroll-horizontal di mobile) | ✅ |
| components/app/* (sidebar, topbar, mobile-nav, child-switcher, store-hydrator, demo-banner, dashboard-guide, page-header, notifications, task-overview, habit-heatmap, tooth-icon, who-growth-chart, growth-chart, semua *-dialog) | ✅ |
| components/auth/auth-shell.tsx | ✅ |
| components/auth/google-button.tsx | ⚠️ siap, butuh GOOGLE_CLIENT_ID/SECRET di .env |
| components/marketing/* (header, footer, pricing), brand/logo | ✅ |

## ✅ Integrasi (scaffold env-gated — aktif begitu key diisi)
> Cara dapat kredensial: **INTEGRATIONS_SETUP.md**.

| Item | Status |
|---|---|
| Mailer / reset password (Resend) | ✅ kode jadi; dev fallback log ke console; isi `RESEND_API_KEY` |
| Upload foto (Cloudinary) | ✅ `/api/upload` + Settings "Ubah Foto"; isi `CLOUDINARY_*` |
| Pembayaran (Midtrans Snap + webhook) | ✅ `/api/payment/*`; isi `MIDTRANS_*`; tanpa key → fallback demo trial |
| Google OAuth | ✅ kondisional di auth.ts; isi `GOOGLE_CLIENT_ID/SECRET` |
| CI (lint+typecheck+build) | ✅ `.github/workflows/ci.yml` |

## ⚠️ Sengaja ditunda (sentuh store yang rapuh / butuh infra)
- Kategori task & habit kustom (in-memory) — butuh tabel + refactor store
- Streak global statis — butuh analisis riwayat habit (store)
- Toggle notifikasi (kosmetik) — butuh kolom preferensi
- Export PDF nyata — butuh lib (jsPDF/Puppeteer)
- Generator reminder otomatis (imunisasi/posyandu/deadline) — butuh cron/queue
- Sentry — DSN disiapkan; jalankan `npx @sentry/wizard -i nextjs` saat live
