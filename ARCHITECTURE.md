# Software Architecture — Jurnal Emas Si Kecil v2

**Author:** Principal Software Architect • **Status:** Target architecture for build
**Companions:** `PRD_V2.md` (what) · `BACKLOG.md` (when) · this doc (how) • **Updated:** 2026-06-30

**Design mandate:** comfortably support **1,000,000 families** (~1.5M children) without a
rewrite. The current stack (Next.js 16 App Router, Drizzle/Postgres on Neon, Better Auth,
Zustand, Midtrans, Cloudinary, Gemini, Vercel) is **fundamentally sound and is kept**. This
is an *evolution by strangler-fig*, not a rewrite: we harden, extend, and add infra around a
codebase whose authorization model and clinical logic are already good.

---

## 0. Architectural Principles (the rules every decision obeys)

1. **Additive evolution.** No big-bang rewrite. New tables/columns are additive; new infra is
   introduced behind flags; existing defensive hydrate (`.catch(()=>[])`) is preserved.
2. **Deny-by-default authorization, enforced server-side.** Every read/write is scoped by
   identity (`resource()` factory today; membership-based tomorrow). The client is never
   trusted for price, plan, role, or verdict.
3. **Correctness is testable.** All clinical/financial logic is pure and unit-tested with
   golden vectors. A verdict a parent sees must be reproducible from code + data.
4. **Graceful degradation.** Every third party (Gemini, Midtrans, Cloudinary, push, email) is
   capability-gated (`xConfigured()`) and degrades to a calm 503, never a 500 page.
5. **Stateless compute, stateful edges.** App servers (Vercel functions) hold no session
   state; all state lives in Postgres / Redis / object storage / queue.
6. **Scale the data path, not the dev model.** The biggest scale risks are (a) serverless DB
   connection exhaustion and (b) the client hydrating *all* data at once. Both are fixed
   structurally below.
7. **Privacy by design.** Children's data is sensitive personal data (UU PDP). Minimize,
   consent, encrypt, expire, export, erase.

**Target SLOs at 1M families:**
- p75 API < 250 ms, p99 < 800 ms (excluding LLM/upload upstreams).
- Availability 99.9% on core read/write; degraded-but-up during any single third-party outage.
- Notification fan-out (1M digests) completes < 30 min, at-least-once with dedupe.
- RPO ≤ 5 min, RTO ≤ 1 h (see Backup/DR).

---

## 1. Module Register — Keep / Extend / Refactor / Replace / Remove

Every existing module reviewed, with a verdict and the reason. Grounded in the real files.

### 1.1 Backend libs (`src/lib`)

| Module | Verdict | Why |
|---|---|---|
| `lib/api.ts` (`resource()`, `getUser`, `sanitize`, `ownsChild`) | **Extend** | The backbone — clean per-user scoping + column whitelist. Extend `ownsChild`→`canAccessChild` for memberships; add windowed/paginated GET (today it returns whole tables). Keep the contract. |
| `lib/admin.ts` (`getAdmin`, `adminResource`) | **Keep** | Fresh-from-DB role check + audit-friendly factory. Solid. Minor: add list pagination. |
| `lib/admin-audit.ts` | **Keep** | Append-only audit is correct; extend coverage to new sensitive actions (invites, plan changes). |
| `lib/auth.ts` (Better Auth) | **Extend** | Keep Better Auth. Extend: hard-fail on weak secret in prod (F0.2), turn on email verification, move rate-limit storage to DB/Redis at scale. |
| `lib/plan.ts` / `lib/subscription.ts` / `lib/gating.ts` (`ACCESS_POLICY`) | **Refactor** | Logic is correct but **`ACCESS_POLICY` (code) and `role_permissions` (admin table) duplicate the source of truth** → make the DB matrix authoritative, seed it from code, cache it. Centralize into one `planAllows(userId, feature)`. |
| `lib/midtrans.ts` / `lib/payment-apply.ts` | **Keep + Extend** | Idempotent, signature-verified, period-anchored — genuinely good. Extend to apply discount codes (currently unused) and emit billing analytics. |
| `lib/who.ts` / `lib/who-lms.ts` | **Keep + Extend** | Medically correct LMS z-scores with tail adjustment. Extend with weight-for-length/height (WHZ) + BMI-for-age (length-indexed interpolation). Do **not** rewrite. |
| `lib/red-flags.ts` | **Keep** | Correct, calm, CDC-aligned. Extend inputs as corrected-age lands. |
| `lib/coach-context.ts` | **Keep + Extend** | Good grounding builder. Extend with care-logging/nutrition/KPSP context; bound the journal query. |
| `lib/ai/provider.ts` | **Extend** | Right abstraction (swappable LLM). Extend: move Gemini key to header (not URL), add timeout/retry/circuit-breaker, add streaming, add an abstraction for "summarize" vs "answer". |
| `lib/push.ts` / `lib/use-push.ts` | **Keep + Extend** | VAPID web-push with dead-sub pruning is correct. Extend to run via the queue (fan-out), not inline loops. |
| `lib/notifications-gen.ts` | **Refactor** | Generation logic moves into the **insight rules engine** behind the queue; keep the rule definitions. |
| `lib/cloudinary.ts` | **Extend** | Signed uploads are right. Extend: server-derived folder, moderation, EXIF-GPS strip, quota. |
| `lib/mailer.ts` | **Keep** | Resend-ready, dev-console fallback. Activate + add transactional templates. |
| `lib/mock-data.ts` | **Keep (isolate)** | Powers demo mode — valuable for acquisition. Keep but ensure it never ships into prod data paths (it doesn't today). |
| `lib/child-templates.ts` / `daily-activities.ts` / `domains.ts` / `journal.ts` / `milestone-validation.ts` | **Keep** | Reference/seed content + pure helpers. Move toward admin-managed versioned content over time (like `ref_*`). |
| `lib/image-compress.ts` | **Keep** | Client-side pre-upload compress reduces cost/bandwidth — good at scale. |
| `lib/utils.ts` (`getAge`, etc.) | **Extend** | Add corrected-age; ensure timezone-correct day boundaries (used by care logging). |
| `lib/types.ts` / `nav.ts` / `site.ts` / `tour-steps.ts` / `og-card.tsx` | **Keep** | Stable presentation/config. |
| `lib/api-client.ts` / `auth-client.ts` / `admin-client.ts` | **Extend** | Add typed errors, retry/backoff, and a thin data-fetching layer (SWR/React Query) for windowed reads. |

### 1.2 Data layer (`src/db`)

| Module | Verdict | Why |
|---|---|---|
| `db/index.ts` (postgres-js client, HMR reuse) | **Refactor** | **Critical at scale:** raw `postgres-js` per serverless instance exhausts Neon connections. Route all queries through the **Neon pooler (PgBouncer, transaction mode)**; cap pool size per instance; keep Drizzle. |
| `db/schema/auth.ts` | **Keep** | Better Auth contract; add indexes (`session.userId`, `account.userId`). |
| `db/schema/app.ts` (12 domain tables) | **Extend** | Keep; add indexes on hot FKs/dates; add `deletedAt` (soft-delete); add care-logging/KPSP/membership tables; partition high-volume tables (care logs) by time. |
| `db/schema/admin.ts` (`ref_*`, `role_permissions`, …) | **Extend** | Add `version` to `ref_*`; add `ref_kpsp_questions`, `ref_mpasi_*`, `ref_recipes`; make `role_permissions` authoritative. |

### 1.3 State (`src/store`)

| Module | Verdict | Why |
|---|---|---|
| `store/app-store.ts` (single Zustand store, hydrate-all) | **Refactor (highest-priority client change)** | One store that **fetches every table on app open** does not scale to multi-year accounts. Split into **domain slices**, lazy-hydrate per route, and move large time-series (care logs, journal) to **windowed server queries via React Query**, keeping Zustand only for small/global + optimistic UI state. Preserve the optimistic+persist UX. |
| `store/ui-store.ts` / `store/tour-store.ts` | **Keep** | Small, correct, local UI state. |

### 1.4 API routes (`src/app/api/*`)

| Group | Verdict | Why |
|---|---|---|
| User CRUD (`children, tasks, todos, habits, milestones, goals, growth, immunizations, teeth, sleep, journal, notifications, subscriptions`) | **Keep + Extend** | All via `resource()` — consistent & scoped. Extend with pagination + membership checks. |
| `api/coach` | **Keep + Extend** | Grounded, rate-limited, persisted. Extend: streaming, bounded context, circuit breaker. |
| `api/payment/*` | **Keep** | Snap + signature webhook + reconcile — correct. Extend discounts. |
| `api/upload` | **Extend** | Harden (folder/moderation/EXIF/quota). |
| `api/push/*` + `api/cron/morning-digest` | **Refactor** | Move from inline per-user loop to **queue fan-out**. |
| `api/public/report/[token]` | **Keep + Extend** | Token+expiry+minimal data — good. Add PIN + revoke. |
| `api/me/export` | **Keep** | UU PDP export — keep; extend with new data classes. |
| `api/admin/*` | **Keep + Extend** | `adminResource`/`getAdmin` gated. Add pagination, content versioning, new `ref_*`. |
| `api/auth/[...all]` | **Keep** | Better Auth handler. |

### 1.5 What is **Removed** / **Replaced**

- **Removed (or wired):** the **dead discount path** — `discount_codes` exists but is never
  applied. Decision: **wire it** (F3.2). If product declines promos, remove the table+admin UI
  to avoid drift. No third option (a cosmetic feature is debt).
- **Replaced:** the **cosmetic `role_permissions` admin matrix** — replace the "code is the
  only enforcement" reality by making the **DB matrix authoritative** (seeded from
  `ACCESS_POLICY`, cached). The admin toggles then mean what they appear to mean.
- **Replaced (mechanism, not feature):** inline cron notification loop → durable queue.
- **Refactored away:** the monolithic hydrate-all store contract (kept as a fallback during
  the strangler migration, then retired).

**Nothing else is removed.** The codebase is lean; the work is extension + infra, not deletion.

---

## 2. System Context (target)

```
                         ┌──────────────────────────────────────────────┐
   Browsers / PWA ──────►│  Vercel Edge (CDN, static, ISR, middleware)   │
   (parents, family,     └───────────────┬──────────────────────────────┘
    cadres, clinics)                      │
                          ┌───────────────▼───────────────┐
                          │  Next.js App Router (RSC + RH) │  stateless functions
                          │  - Server Components (reads)   │
                          │  - Route Handlers (writes/API) │
                          └──┬────────┬───────┬────────┬───┘
                             │        │       │        │
                   ┌─────────▼──┐  ┌──▼────┐ ┌▼──────┐ ┌▼────────────┐
                   │ Neon PG    │  │ Redis │ │ Queue │ │ AI provider │
                   │ (pooler +  │  │(Upst.)│ │(QStash│ │ (Gemini)    │
                   │  replicas) │  │ cache │ │/Upst.)│ └─────────────┘
                   └────┬───────┘  └───────┘ └──┬────┘
                        │                       │ workers (fan-out)
              ┌─────────▼─────────┐    ┌────────▼────────┐   ┌──────────────┐
              │ Object storage    │    │ Web Push (VAPID)│   │ Email (Resend)│
              │ Cloudinary (media,│    │ + Notif rules   │   │ transactional │
              │ moderation, CDN)  │    └─────────────────┘   └──────────────┘
              └───────────────────┘
   Observability: Sentry (errors) · Vercel Analytics/Speed Insights · Logs (structured)
   Payments: Midtrans Snap + signed webhook
```

---

## 3. Database Architecture

**Engine:** PostgreSQL (Neon) — **kept**. Serverless-friendly, branching for preview envs
(already used), good enough to 1M families with the structure below.

**Connection management (the #1 scale fix):**
- All app→DB traffic goes through the **Neon pooler (PgBouncer, transaction pooling)**.
- Drizzle/`postgres-js` configured with a **small per-instance pool** (e.g. `max: 1–3`) since
  many serverless instances multiply connections; the pooler multiplexes to the primary.
- Long-running/analytic queries use a **separate connection** (session pooling) to avoid
  starving transactional traffic.

**Read/write split:**
- Writes → primary. Heavy reads (admin analytics, population aggregates, report generation) →
  **read replica(s)**. App reads stay on primary for read-your-writes consistency on the
  optimistic path; analytics tolerate replica lag.

**Schema strategy:**
- Keep the existing 3-schema split (`auth`, `app`, `admin`).
- **Indexing pass (required):** composite indexes on every hot access pattern —
  `(userId)`, `(childId)`, `(childId, date/at)`, `session(userId)`, `account(userId)`,
  `transactions(orderId)` (unique exists), `push_subscriptions(userId)`. Add partial indexes
  for `WHERE deletedAt IS NULL`.
- **Partitioning:** high-volume time-series — `feed_logs`, `diaper_logs`, `sleep_logs`,
  `journal_entries`, `notifications`, `coach_messages` — **partition by month** (range) once
  volume warrants; queries are always child-scoped + date-windowed, so partition pruning is
  natural.
- **Soft-delete:** `deletedAt` on `children` (and cascade-aware reads); 30-day purge job.
- **Reference content versioning:** `ref_*` tables gain `version` + `active`; clinical content
  changes are new versions, never destructive edits (auditability + rollback).
- **Data classes & retention:** sensitive health data retained for the account lifetime;
  on erasure, hard-delete via existing cascade; analytics/event data de-identified and
  separately retained.

**Capacity sketch (1M families):** dominant tables are care logs + journal. At ~30% DAU ×
~10 events/day ≈ 3M rows/day on care logs → ~1B rows/year → **partitioning + windowed reads +
archival of cold partitions to cheaper storage** keeps the working set small. Growth/
milestone/KPSP tables are low-volume (bounded per child).

**Migrations:** Drizzle, numbered, **additive only**; applied to a Neon **preview branch**
first (existing workflow), then prod by the operator. Next free number: **0013**.

---

## 4. API Architecture

**Style:** keep **REST via Next.js Route Handlers** — no GraphQL (the factory pattern already
gives uniform, typed CRUD; GraphQL would add cost without payoff here).

**Layering:**
```
Route Handler (HTTP, auth gate, validation)
   └─► Service function (business logic, pure where possible)
        └─► Repository (Drizzle queries, the only DB-aware layer)
```
Today logic sits partly in handlers; **refactor toward thin handlers + service/repo** so logic
is unit-testable without HTTP and reusable across REST + queue workers + RSC.

**Conventions (enforced):**
- Auth gate first (`getUser`/`getAdmin`/`canAccessChild`), deny-by-default.
- **Input validation via a schema layer** (introduce **Zod**) replacing ad-hoc casting in
  `sanitize`; the whitelist stays as defense-in-depth.
- **Pagination everywhere** on collections: cursor-based (`?cursor=&limit=`) keyed on
  `(createdAt,id)`; no unbounded `select *`.
- **Idempotency** for unsafe external effects (payments already; uploads + queue jobs add
  idempotency keys).
- **Versioning:** breaking changes ship under `/api/v2/...`; current routes are implicitly v1
  and remain stable.
- **Rate limiting:** Better Auth limits on auth (move storage to Redis at scale); a global
  Redis token-bucket on expensive routes (`/api/coach`, `/api/upload`, discount validation).

**Error contract:** consistent `{ error, code?, premiumRequired? }` (already partly present);
map upstream failures to calm Indonesian copy + correct status (401/403/404/429/503/502).

---

## 5. Frontend Architecture

**Keep:** Next.js App Router, React 19, Tailwind + shadcn/Radix, Recharts.

**Rendering strategy:**
- **Marketing/legal/landing** → static + ISR (SEO, near-zero cost at scale).
- **App shell** → client; **data-heavy reads** progressively move to **React Server
  Components** (dashboard summaries, reports) to cut client payload and DB round-trips.
- **Interactive/optimistic** surfaces (logging, dialogs) stay client + Zustand.

**Data fetching:** introduce **React Query (TanStack)** for server state — windowed,
cached, background-refetched — while **Zustand keeps only**: current child, UI state, and
optimistic mutations. This retires the "hydrate everything on load" model.

**Component layers (kept):** `ui/` (primitives) · `app/` (feature) · `marketing/` · `brand/`.
Add `features/<domain>/` co-location for new domains (KPSP, care, nutrition, family).

**Performance:** route-level code splitting; lazy-load Recharts and heavy dialogs; responsive
images via Cloudinary transforms + Next `<Image>`; `prefers-reduced-motion` respected;
bundle budget enforced in CI.

---

## 6. Folder Structure (target)

```
src/
  app/
    (marketing)/            # static/ISR landing, pricing, legal
    (auth)/                 # login/register/reset
    (app)/                  # authenticated shell + routes (RSC where possible)
      dashboard/ growth/ development/ (kpsp, milestones)  care/ (feed,sleep,diaper)
      nutrition/ journal/ catatan/ reports/ family/ settings/
    admin/                  # admin SPA (gated)
    api/                    # v1 route handlers (existing) ; api/v2 for breaking changes
    r/[token]/              # public report
  features/                 # NEW: domain-cohesive modules
    growth/ development/ kpsp/ care/ nutrition/ family/ billing/ coach/
      {components, hooks, services (pure logic), api-client, types}.ts
  server/                   # NEW: server-only
    services/               # business logic (testable, no HTTP)
    repositories/           # Drizzle queries (only DB-aware layer)
    queue/                  # producers + workers
    notifications/          # rules engine + channels (push/email)
    ai/                     # provider, prompts, guards
  db/                       # schema + client (pooled)
  lib/                      # cross-cutting pure utils (who, red-flags, utils, i18n, analytics)
  store/                    # Zustand slices (small/global/optimistic only)
  components/ui|brand|marketing/
  middleware.ts
```
Strangler note: existing `lib/*` business logic migrates into `server/services` incrementally;
re-exports keep old import paths working during the transition.

---

## 7. State Management

| Concern | Owner | Notes |
|---|---|---|
| Server/entity data (lists, time-series) | **React Query** | windowed, cached, retried, background-refresh; replaces hydrate-all |
| Current child, plan, UI flags | **Zustand** (slices) | small, global, synchronous |
| Optimistic mutations | **Zustand + React Query** | optimistic update → mutation → invalidate on settle |
| Form state | local/RHF | dialogs |
| Offline write queue | **IndexedDB + SW** | see Offline |

Migration: introduce React Query alongside the current store; move one domain at a time
(start with care logs / journal — the unbounded ones); retire `hydrate()` last.

---

## 8. Caching Strategy

Multi-layer:
1. **CDN/edge (Vercel):** static + ISR for marketing; cacheable public report responses
   (short TTL, token-scoped).
2. **Redis (Upstash, serverless-friendly):** hot, expensive, or cross-request data —
   `getUserPlan`/role + feature matrix (TTL + explicit invalidation on plan/role change),
   reference content (`ref_*`, KPSP forms, IDAI schedule — invalidate on admin publish),
   rate-limit buckets, AI-coach idempotency, due-reminder computation caches.
3. **React Query client cache:** per-user server state with stale-while-revalidate.
4. **DB query shaping:** indexes + materialized views for admin analytics (refresh on schedule).

Invalidation rules are explicit per key (no blind TTL on correctness-sensitive data like plan).

---

## 9. Queue System

**Choice:** **QStash / Upstash Workflow** (HTTP-based, serverless-native) or Vercel Queues,
backed by a `scheduled_jobs` table for durability + auditability.

**Uses:**
- Notification fan-out (morning digest, weekly digest) — enqueue per user, process with
  concurrency + retries (replaces the inline loop that won't scale).
- Scheduled per-user reminders (KPSP re-screen +14d, immunization due, care reminders).
- Async media moderation reconciliation.
- Heavy report/Buku-Emas PDF generation.
- Soft-delete purge job.

**Guarantees:** at-least-once delivery + **idempotency keys** + dedupe window; dead-letter
queue with alerting; backoff on transient upstream failures (push/email/AI).

---

## 10. Notification System

**Channels:** Web Push (VAPID — kept, fan-out via queue), Email (Resend — transactional),
in-app `notifications` table. SMS/WhatsApp as a **future channel** (high value in Indonesia;
abstract the channel interface now).

**Architecture:**
```
Insight Rules Engine (deterministic) ──► Notification intents
   ├─ immunization due/overdue   ├─ KPSP due / re-screen
   ├─ growth not measured        ├─ care reminders (opt-in)
   └─ journal memory resurfacing └─ weekly digest summary (optional LLM)
        ▼
   Channel dispatcher (queue) ──► [push] [email] [in-app]
        ▼  preferences + frequency caps + quiet hours (per user)
```
- **Preferences honored** (the M55 "honest notifications" principle continues — never claim a
  toggle that doesn't fire).
- **Dead-subscription pruning** preserved (404/410 → delete).
- **Frequency caps + quiet hours** to prevent fatigue; all notifications logged for audit.

---

## 11. Search System

**Phase 1 (sufficient to ~1M):** **Postgres full-text search** (`tsvector` + GIN index) over
`journal_entries` (title/body/tags) and reference content (recipes, milestones), scoped by
user/child. Trigram (`pg_trgm`) for fuzzy name/tag search. No extra infra.

**Phase 2 (if needed):** if cross-cutting search or typo-tolerant ranking becomes a product
need, introduce **Meilisearch/Typesense** fed by CDC from Postgres. Deferred — not needed for
launch scale.

Admin search (users, transactions) uses indexed Postgres queries with pagination.

---

## 12. AI Architecture

**Keep** the swappable provider (`lib/ai/provider.ts`); **extend** to a small AI service layer:
```
server/ai/
  provider.ts     # Gemini (key via HEADER not URL), timeout, retry, circuit-breaker, streaming
  prompts/        # versioned system prompts (COACH_SYSTEM_PROMPT, summary, KPSP-explain)
  guards.ts       # input limits, output safety, grounding enforcement, "bukan diagnosis"
  context/        # buildCoachContext (+care/nutrition/KPSP), bounded & cached
```
- **Grounding preserved & extended:** answers only from the child's own data (already the
  design); add care-logging, nutrition, KPSP context with bounded sizes.
- **Safety:** never diagnostic; serious concerns → health worker; rate-limited per plan
  (`coach_usage`, kept); **server-only key**; PII never logged to analytics.
- **Reliability:** circuit-breaker + timeout + calm fallback (already maps errors → 429/502/503).
- **Cost control:** per-plan quotas (exists), response caching for identical grounded prompts,
  streaming to cut perceived latency.
- **Future:** proactive insight summaries (deterministic rules → optional LLM phrasing),
  vision milestone tagging (consent-gated), all behind the same provider abstraction.

---

## 13. File Storage & Media Processing

**Keep Cloudinary** (storage + CDN + transforms + moderation in one — right call at this scale).

**Pipeline (hardened):**
```
Client (image-compress.ts) ─► /api/upload (auth + plan gate + MIME/magic-byte + size)
   ─► server-derived folder jurnal-emas/{userId}/{purpose}
   ─► EXIF-GPS strip ─► signed upload ─► moderation (async)
   ─► moderation callback (signed) ─► approve→reveal | reject→delete + flag
   ─► responsive transforms on delivery (Next <Image>)
```
- **Per-user quota** (`upload_usage`) prevents storage abuse.
- **Privacy:** strip location EXIF; private delivery URLs; no public listing; signed URLs where
  needed.
- **Media records** (`media_assets`) track moderation status; orphan cleanup job via queue.

---

## 14. Monitoring, Logging, Analytics, Observability

- **Errors:** **Sentry** (server + client), release-tagged, **PII-scrubbed** (no journal/coach
  text, names, emails). MTTD < 5 min.
- **Performance:** Vercel Speed Insights (RUM) + Analytics; custom timing on AI/upload/DB.
- **Structured logging:** JSON logs with request id, hashed user id, route, latency, status;
  **no PII / no child data** in logs. Centralized via Vercel log drains to a sink (e.g.
  Datadog/Logflare) at scale.
- **Product analytics:** the `track()` registry (§A.5 of PRD) → funnels (activation, KPSP,
  billing, retention). Consent-gated; de-identified.
- **Health checks & alerts:** synthetic checks on auth, a write path, payment webhook; alerts
  on error rate, queue dead-letter depth, DB connection saturation, push failure rate.
- **Dashboards:** golden-signal dashboard (latency, traffic, errors, saturation) + business
  KPIs (WAF, conversion).

---

## 15. CI/CD

**Keep** GitHub Actions + Vercel. **Extend the gate:**
```
PR:   lint ─► tsc --noEmit ─► npm test (unit+integration, coverage gate) ─► build
      ─► (changed-migration?) apply to ephemeral/preview DB ─► Playwright E2E (core)
      ─► preview deploy (Vercel) ─► security checks (deps audit, secret scan)
main: full E2E + visual regression (nightly) ─► production deploy (operator-gated migrate)
```
- **DB migrations** validated against a Neon preview branch; never auto-applied to prod
  (operator runs prod migrate — existing workflow).
- **Feature flags** for risky rollouts (memberships, discounts, offline).
- **Release gates:** clinical sign-off (medical trains), security review (authz/payment/media).

---

## 16. Backup & Recovery

- **Neon PITR** (point-in-time restore) — **RPO ≤ 5 min** via WAL; verify retention window
  meets policy.
- **Logical backups:** nightly `pg_dump` of critical schemas to encrypted object storage,
  cross-region, 30–90 day retention.
- **Media:** Cloudinary durability + an export/backup job for originals to cold storage.
- **Restore drills:** quarterly restore-to-staging test; documented runbook in `DEPLOYMENT.md`.
- **Backup integrity:** checksums + automated restore verification.

---

## 17. Disaster Recovery

- **RTO ≤ 1 h, RPO ≤ 5 min.**
- **Compute:** stateless Vercel functions → redeploy/region failover is trivial (no state to
  recover).
- **DB:** Neon multi-AZ; for region loss, restore PITR/logical backup to a standby project;
  DNS/env cutover documented.
- **Third parties:** capability-gating means an outage degrades features, not the app. Payment
  webhook is reconcilable (status pull) so missed webhooks self-heal.
- **DR runbook:** ordered steps, owner on-call, comms template, dependency checklist; rehearsed
  semi-annually.

---

## 18. Scalability Strategy (to 1M families)

| Risk | Mitigation |
|---|---|
| **Serverless DB connection storm** | Neon pooler (transaction mode) + tiny per-instance pool + repo layer |
| **Client hydrate-all** | React Query windowed reads; RSC summaries; retire `hydrate()` |
| **Notification fan-out** | Durable queue, concurrency, idempotency (no inline loops) |
| **High-volume time-series** | Monthly partitioning + windowed queries + cold-partition archival |
| **Read amplification** | Read replicas for analytics/reports; Redis cache for plan/role/ref content |
| **Hot endpoints (coach/upload)** | Redis rate limiting + per-plan quotas + circuit breakers |
| **Admin analytics on big tables** | Materialized views refreshed on schedule, on replica |
| **Cost at scale** | ISR/CDN for marketing, image compression, AI caching+quotas, archival tiers |

Horizontal scale is automatic (Vercel); the work is making the **data path** sublinear via
caching, windowing, partitioning, and async fan-out. No single component requires a rewrite to
reach 1M families.

---

## 19. Security Strategy

- **AuthN:** Better Auth (sessions 30d), email verification on, Google OAuth; secret hard-fail
  in prod; rate-limited auth (Redis-backed at scale); optional 2FA (future).
- **AuthZ:** deny-by-default; per-user scoping today → **membership-based `canAccessChild`**;
  server-side role/plan checks; admin role fresh-from-DB + audit log. Full **authz test
  matrix** is a release gate for the membership refactor (highest-risk change).
- **Input:** Zod validation + column whitelist; output encoding; **CSP** (report-only→enforce);
  existing security headers (HSTS/X-Frame/nosniff/Permissions-Policy) kept.
- **Payments:** server-side price + discount computation; signed webhooks; idempotent
  settlement; never trust client amount.
- **Media:** moderation + EXIF strip + signed uploads + quotas.
- **Secrets:** server-only; never in client bundles or URLs (move Gemini key to header);
  rotation runbook; CI secret scanning + dependency audit.
- **CSAM/abuse:** moderation pipeline + legal reporting hook (Indonesian obligations).
- **Pen-test:** pre-launch + annual; bug-bounty/`security.txt` disclosure path.

---

## 20. Privacy Strategy (UU PDP / GDPR-aligned)

- **Data minimization & purpose limitation:** collect only what a feature needs; children's
  data treated as **sensitive personal data**.
- **Consent:** explicit, granular consent for new processing (AI on photos, sharing a child
  with a caregiver, analytics cookies); records of consent.
- **Rights:** **export** (`/api/me/export`, extended) + **erasure** (cascade hard-delete) +
  **rectification**; soft-delete grace before purge, with immediate-erasure option.
- **Sharing controls:** report links token+expiry+PIN+revoke; caregiver access role-scoped +
  instantly revocable.
- **Minimization in telemetry:** no PII/child data in logs, analytics, Sentry, or AI training;
  hashed identifiers.
- **Location safety:** strip photo GPS EXIF (protect children's home location).
- **Data residency:** prefer region-appropriate hosting; document sub-processors (Neon, Vercel,
  Cloudinary, Gemini, Resend, Midtrans, Upstash) in a public **sub-processor list** + DPA.
- **Retention schedule:** defined per data class; automatic purge of expired shares, dead push
  subs, old partitions.

---

## 21. Offline Strategy

**Goal:** reliable 3 a.m. logging and low-bandwidth (non-urban) reach.
- **Service worker** (already present for push) extended to **app-shell precache** + **runtime
  cache** of recent reads.
- **Write queue in IndexedDB:** care-logging and journal writes captured offline, flushed on
  reconnect with **idempotency keys**.
- **Conflict resolution:** **last-write-wins per field** with server timestamps; bounded
  offline window; user-visible sync status.
- **Read offline:** last-synced windowed data served from cache (React Query persistence).
- **Scope:** offline targets the daily-care + journal + KPSP-capture paths first (highest 3
  a.m. / low-signal value); not payments/admin.
- **Degradation:** PWA install prompt exists; offline indicator + retry UX; never lose user
  input.

---

## 22. Phased Delivery of the Architecture (strangler order)

1. **Stabilize the data path:** pooler + indexes + Zod + thin handlers + repo layer (no UX change).
2. **Observability + security base:** Sentry, structured logs, CSP, env hardening, upload
   hardening (E0).
3. **Retire hydrate-all:** React Query for care/journal; RSC summaries.
4. **Queue + notifications engine:** before scaling reminders (E2 infra).
5. **Caching (Redis):** plan/role/ref content + rate limits.
6. **Membership authz** (E3) — behind flag, full test matrix, security gate.
7. **Read replicas + partitioning + materialized views** — when volume warrants (data-driven).
8. **Offline + search Phase-2** — as product need proves out.

Each phase is independently shippable and reversible (flags), consistent with the established
"one verified milestone per cycle, additive, operator pushes & migrates prod" workflow.

---

## 23. Summary Verdict

- **Kept (core):** Next.js/RSC, Neon Postgres, Drizzle, Better Auth, Zustand (reduced scope),
  Cloudinary, Midtrans, Gemini provider abstraction, the `resource()`/`adminResource()`
  factories, the WHO/red-flag/coach clinical logic.
- **Extended:** clinical indicators, AI service, upload pipeline, notifications, API (pagination
  /Zod/versioning), admin content versioning.
- **Refactored:** DB connection pooling, the monolithic store → slices + React Query, plan
  gating into one DB-authoritative source, thin-handler/service/repo layering.
- **Replaced (mechanism):** inline cron loop → queue; cosmetic role matrix → authoritative.
- **Removed/Decided:** dead discount path (wire or delete — no cosmetic middle).

The architecture reaches 1M families by fixing two structural bottlenecks (serverless DB
connections; client hydrate-all) and adding three pieces of infra (queue, Redis cache,
read replicas/partitioning) — all additive, all reversible, none requiring a rewrite.
```
