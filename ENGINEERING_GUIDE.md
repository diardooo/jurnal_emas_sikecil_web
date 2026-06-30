# The Developer Handbook — Jurnal Emas Si Kecil

**The canonical engineering guideline. Permanent. Authoritative.**
**Companions:** `PROJECT_CONTEXT.md` (state) · `PRD_V2.md` (what) · `BACKLOG.md` (when) ·
`ARCHITECTURE.md` (how) · **this** (the rules). **Updated:** 2026-06-30

> If a rule here conflicts with a habit, the rule wins. If a rule here conflicts with
> `ARCHITECTURE.md`, raise it — one of them is wrong and must be fixed, not ignored.
> This document describes the conventions **already true in the codebase** plus the bar we
> hold going forward. New code MUST look like it was written by the same person who wrote the
> `resource()` factory.

---

## 0. The Prime Directives (memorize these five)

1. **Additive, not destructive.** One verified feature per cycle. New columns/tables are
   additive; existing data and behavior keep working. The operator pushes & migrates prod.
2. **Deny by default, scoped by identity, enforced on the server.** Never trust the client for
   identity, role, plan, price, or any verdict.
3. **Correctness is testable and tested.** Clinical and financial logic is pure and covered by
   golden tests. A number a parent sees must be reproducible from code + data.
4. **Degrade gracefully.** Every third party is capability-gated and fails to a calm Indonesian
   message, never a crash.
5. **The gate is sacred.** `tsc --noEmit` + `npm run lint` + `npm test` + `npm run build` are
   all green before anything merges. No exceptions, no "fix it later."

---

## 1. Architecture Principles

- **Strangler-fig evolution, never a rewrite.** Extend the existing structure; introduce new
  infra behind flags; keep old import paths working during a migration.
- **Stateless compute, stateful edges.** App code holds no session state; state lives in
  Postgres / Redis / object storage / queue.
- **Thin handlers → services → repositories.** HTTP concerns in the route handler; business
  logic in a pure service; the only DB-aware layer is the repository. Logic must be unit-
  testable without HTTP and reusable from REST handlers, queue workers, and RSC.
- **Pure where possible.** Clinical math (`who.ts`, `red-flags.ts`), scoring (KPSP), money
  (`payment-apply.ts`) are pure functions with no I/O — so they are trivially testable.
- **One source of truth.** No fact is encoded twice. If the admin can edit it, the admin table
  is authoritative and code seeds it — never the reverse drift (see `ACCESS_POLICY` lesson).
- **Capability gating.** Optional integrations expose `xConfigured()` and return `503` when
  unset (`aiConfigured`, `midtransConfigured`, `cloudinaryConfigured`, `pushConfigured`).
- **Scale the data path, not the dev model.** Windowed reads, pagination, partitioning, async
  fan-out — never load "everything" and never loop per-user inline.

---

## 2. Coding Standards

- **Language:** TypeScript, `strict` on. **No `any`** in committed code except at a documented
  boundary (e.g. the factory's `AnyTable` cast) with a comment explaining why.
- **No implicit `undefined` data leaks:** validate inputs (Zod going forward) before use.
- **Pure functions** declared with explicit input/output types; no hidden globals; no
  `Date.now()` deep inside pure logic — pass time/age in so it's testable.
- **Comments explain WHY, not WHAT.** Match the existing density: a short block comment above
  non-obvious modules (see `schema/app.ts`, `payment-apply.ts`). No commented-out code.
- **Error handling:** never swallow silently except the *intentional* defensive hydrate
  (`.catch(() => [])`) for not-yet-migrated tables — and that pattern is documented at the call
  site. Everywhere else, handle and surface.
- **No console noise in committed code** beyond deliberate server logs (structured, no PII).
- **Imports:** use the `@/` alias (tsconfig path) — no deep relative `../../../`.
- **Dates/money:** dates as `date`/ISO strings at the boundary, `Date` in timestamp columns
  (the factory coerces). Money in **integer rupiah** (no floats for currency).
- **i18n:** all new user-facing strings go through the string layer (`t(key)`); no new
  hardcoded Indonesian in components after the i18n layer lands.
- **React:** Server Components for reads where possible; `"use client"` only when interactivity
  is required. Hooks rules respected (the few intentional exceptions are lint-`warn`, not new
  license to break them).

---

## 3. Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| DB table | `snake_case`, plural | `growth_records`, `push_subscriptions` |
| DB column | `snake_case` | `child_id`, `age_months`, `created_at` |
| Drizzle field (TS) | `camelCase`, maps to column | `childId`, `ageMonths`, `createdAt` |
| Type / interface | `PascalCase` | `RedFlag`, `WhoStatus`, `CoachContextInput` |
| Function / var | `camelCase`, verb-first for actions | `evaluateRedFlags`, `buildCoachContext`, `getUserPlan` |
| Boolean | `is/has/should` prefix | `isPremium`, `hasPhoto`, `isCritical` |
| Pure predicate factory | `xConfigured()` | `aiConfigured()`, `midtransConfigured()` |
| React component file | `kebab-case.tsx` | `growth-chart.tsx`, `journal-dialog.tsx` |
| React component | `PascalCase` | `GrowthChart`, `JournalDialog` |
| Route handler file | `route.ts` under REST path | `api/children/[id]/route.ts` |
| Zustand store | `use<Name>Store` | `useAppStore`, `useUiStore` |
| Migration | drizzle auto-name, **sequential number** | `0013_*.sql` |
| Analytics event | `domain.object_action` | `growth.measurement_added`, `kpsp.screening_completed` |
| Env var | `SCREAMING_SNAKE`, public ones `NEXT_PUBLIC_*` | `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` |
| Indonesian UI copy | natural, **never "Bunda/Bun"** (not universal) | use the user's name or neutral phrasing |

---

## 4. Folder Rules

- **Routes** live in `src/app`; route groups `(marketing)`, `(auth)`, `(app)`, `admin`.
- **Feature-cohesive code** goes in `src/features/<domain>/` (components, hooks, pure services,
  api-client, types) as new domains are built.
- **Server-only logic** goes in `src/server/` (`services/`, `repositories/`, `queue/`,
  `notifications/`, `ai/`). The repository layer is the **only** place Drizzle queries live.
- **Cross-cutting pure utils** stay in `src/lib` (`who.ts`, `red-flags.ts`, `utils.ts`,
  `i18n/`, `analytics/`).
- **UI primitives** in `components/ui` (shadcn/Radix); feature components in `components/app`
  or `features/<domain>`; never mix primitives with feature logic.
- **A file does one thing.** If a `route.ts` grows business logic, extract a service.
- **No server-only import in a client component**, and **no client-only import in `lib/`
  modules meant for both** (e.g. `gating.ts` is deliberately server-import-free).

---

## 5. Database Rules

- **Use the column helpers** (`id()`, `userId()`, `createdAt()`); don't hand-roll UUID PKs or
  FK cascade clauses.
- **Every user-owned table** has `userId` FK → `user.id` `onDelete: "cascade"`. **Every
  child-scoped table** also has `childId` FK → `children.id` `onDelete: "cascade"`.
- **JSON columns** are typed (`.$type<...>()`) and default to `[]`/`{}` (never nullable arrays
  the UI must guard).
- **Indexes are part of the feature**, not an afterthought: index every hot access pattern
  (`userId`, `childId`, `(childId, date/at)`, FKs, unique business keys). Partial index for
  `WHERE deleted_at IS NULL`.
- **High-volume time-series** (care logs, journal, notifications) are designed for **monthly
  partitioning** and are **always queried child-scoped + date-windowed** — never `select *`.
- **Reference content** (`ref_*`) is **versioned** (`version`, `active`); clinical content
  changes create a new version, never a destructive edit.
- **Soft-delete** (`deletedAt`) for user-recoverable data; reads filter it out; a purge job
  hard-deletes after the grace window. Right-to-erasure still hard-deletes immediately.
- **No raw connection sprawl:** all DB access goes through the pooled `db` client and the repo
  layer. No new `postgres()` clients.
- **No cross-user/cross-child query without an ownership filter.** This is a security rule, see §9.

---

## 6. Migration Rules

- **Additive only.** New nullable columns, new tables, new indexes. **No** column drops/renames
  or type narrowing without a documented multi-step expand-contract plan + sign-off.
- **Sequential numbering**, generated by drizzle-kit (`npm run db:generate`). Next free number
  is tracked in `PRD_V2.md`/`BACKLOG.md` (currently **0013**). Never reuse or reorder numbers.
- **One migration per logical change**, named meaningfully by drizzle.
- **Apply to a Neon preview branch first**, verify, then the **operator applies to prod** — the
  PR never auto-migrates prod.
- **Backward compatible at deploy:** new code must run against the *old* schema until the
  migration is applied, and old code must survive the *new* schema (additive guarantees this).
- **Seeds are idempotent** (`scripts/seed*.ts`) and versioned where they load `ref_*` content.
- **A migration PR states its number explicitly** and includes the rollback note (drop the new
  additive object — safe because nothing depended on it yet).

---

## 7. API Rules

- **Build CRUD via the factories.** User-owned tables → `resource(table)`. Global/admin tables
  → `adminResource(table)`. Do not hand-write CRUD that re-implements scoping — you will get it
  subtly wrong.
- If a handler must be bespoke, it MUST replicate the three factory guarantees:
  1. **Auth gate first** (`getUser` → 401 / `getAdmin` → 403 / `canAccessChild`).
  2. **Every query filtered by identity** (`userId`, or child membership).
  3. **`childId` writes validated by ownership** (`ownsChild`/`canAccessChild`).
- **Input validation** with Zod at the boundary; the column whitelist (`sanitize`) stays as
  defense-in-depth. Reject unknown/extra fields.
- **Pagination on every collection** (cursor-based on `(createdAt,id)`); no unbounded list
  responses.
- **Status codes:** 200/201 success · 400 bad input · 401 unauth · 403 forbidden/premium · 404
  not found/not-owned · 409 conflict · 410 expired · 429 rate/quota · 503 integration off · 502
  upstream failure. **Return 404 (not 403) for "exists but not yours"** to avoid leaking
  existence.
- **Error shape:** `{ error: string, code?: string, premiumRequired?: boolean }` with calm
  Indonesian copy.
- **Idempotency** for external side effects (payments already; uploads & queue jobs use keys).
- **Versioning:** breaking changes ship under `/api/v2/...`; existing routes stay stable.
- **No secret in a URL** (Gemini key goes in a header). No PII in query strings or logs.

---

## 8. Authentication Rules

- **Better Auth is the only auth.** Don't roll custom session/cookie logic.
- **Session:** 30-day expiry, daily refresh, cookie-cache 5 min (current config). Don't weaken.
- **Email verification is ON** in production; gate sensitive actions (create share link, start
  checkout, accept caregiver invite) behind a verified email.
- **Secrets hard-fail in production.** `BETTER_AUTH_SECRET` must be ≥32 chars and not the dev
  default; missing/weak → boot fails. Dev/demo keep the safe fallback.
- **Rate-limit the auth surface** (sign-in/up, forget/reset have tight custom limits); storage
  moves to DB/Redis at scale so limits hold across serverless instances.
- **`role`/`status` are server-managed** (`input: false`) — never settable from signup/client.
- **OAuth** is optional and capability-gated (`hasGoogle`); absence must not break auth.

---

## 9. Authorization Rules

- **Every read and write is authorized server-side.** The middleware redirect is UX, **not**
  security — the real gate is in the route handler.
- **User-owned data:** filtered by `userId` (the `resource()` factory). **Child-scoped data:**
  authorized through child ownership today, **membership (`canAccessChild(userId, childId,
  minRole)`)** once families land. Roles: `owner` > `editor` > `viewer`.
- **Admin:** `getAdmin` reads role **fresh from the DB** and checks `status === "active"` so
  demotion/suspension is instant. Sensitive admin actions are **audit-logged**
  (`adminAuditLog`) with a snapshotted `actorEmail`.
- **Plan/premium gating** goes through one helper (`planAllows` / `isPremium` / `premiumRequired`)
  reading the **DB feature matrix** (authoritative). Never gate by a client-sent flag.
- **Privilege escalation guards:** only `owner` assigns roles/invites; only the resource owner
  can delete or create share links.
- **The authorization matrix is a tested artifact.** Any change touching scoping ships with
  integration tests proving user B cannot touch user A's / another family's data, and is a
  release gate for the membership refactor.

---

## 10. Security Rules

- **Deny by default.** New endpoint = authenticated + authorized unless explicitly, documentedly
  public (like `/api/public/report/[token]`, which is token + expiry + minimal data).
- **Validate & whitelist all input;** encode all output. No `dangerouslySetInnerHTML` on user
  content — ever.
- **CSP** is enforced; new external origins require an explicit allow-list entry + review. Keep
  the existing headers (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
- **Webhooks verify signatures** before any side effect (Midtrans `verifySignature`); the
  moderation callback is signed too.
- **Payments compute price & discount server-side**; client amounts are ignored; settlement is
  idempotent.
- **Uploads:** server-derived folder, MIME + magic-byte check, size cap, EXIF-GPS strip,
  moderation, per-user quota.
- **Secrets:** server env only; never in client bundles, URLs, or logs; rotated on a runbook;
  CI runs dependency audit + secret scanning.
- **Cron/queue endpoints** require the shared secret (`CRON_SECRET`) — verified before work.
- **No PII in logs/analytics/Sentry/AI training.** Hash user identifiers.
- **Report a vulnerability:** `security.txt` + disclosure path; pen-test pre-launch + annually.

---

## 11. Privacy Rules (UU PDP / GDPR-aligned)

- **Children's data is sensitive personal data.** Treat every field accordingly.
- **Minimize & purpose-limit:** collect only what the feature needs; don't log child names or
  journal/coach text anywhere observability can see them.
- **Consent is explicit and granular** for new processing classes (AI on photos, sharing a
  child with a caregiver, analytics cookies). Record consent.
- **Rights are first-class:** export (`/api/me/export`, extended for new data) + erasure
  (cascade hard-delete) + rectification. Soft-delete grace before purge; immediate-erasure
  option always available.
- **Sharing is bounded & revocable:** report links carry expiry (+PIN, +revoke); caregiver
  access is role-scoped and instantly revocable.
- **Strip photo GPS EXIF** (protect a child's home location).
- **Sub-processors are documented** (Neon, Vercel, Cloudinary, Gemini, Resend, Midtrans,
  Upstash) with a public list + DPA; respect data residency.
- **Retention schedule** per data class; auto-purge expired shares, dead push subs, cold
  partitions.

---

## 12. Performance Rules

- **Budgets:** p75 API < 250 ms (excl. LLM/upload upstreams); LCP < 2.5 s on mid-tier Android /
  4G. CI enforces a bundle budget.
- **No unbounded reads.** Collections are paginated; time-series are date-windowed. The
  hydrate-everything pattern is being retired — do not add to it.
- **Server state via React Query** (windowed, cached, background-refresh). Zustand holds only
  small/global/optimistic state.
- **No per-user inline loops** for fan-out work (notifications/digests) — use the queue.
- **Cache deliberately:** Redis for plan/role/ref content with explicit invalidation (never a
  blind TTL on correctness-sensitive data). ISR for marketing.
- **Lazy-load heavy UI** (Recharts, big dialogs); responsive images via Cloudinary transforms +
  Next `<Image>`.
- **Index before you ship** a query (see §5). A new hot query without an index fails review.
- **AI:** stream, bound context, quota per plan, cache identical grounded prompts.

---

## 13. Accessibility Rules (WCAG 2.1 AA)

- **Keyboard-reachable & labeled:** every interactive element; visible focus; dialogs trap
  focus (Radix does — don't bypass it).
- **Color is never the only signal.** Pair it with text + icon (the red-flag and WHO-status
  cards already do — match that). Contrast ≥ 4.5:1.
- **Forms:** every input has an associated `<label>`; errors announced; KPSP/medical questions
  are proper radio groups.
- **Images:** meaningful `alt`; decorative images `alt=""`.
- **Motion:** respect `prefers-reduced-motion` (celebration animations must).
- **Screen-reader copy is Indonesian** and meaningful; verdicts conveyed in text, not color.
- **Targets** are finger-sized (one-handed 3 a.m. logging is a real use case).

---

## 14. Testing Rules

- **The gate includes `npm test`.** Coverage thresholds: **100% of math/safety modules**
  (`who.ts`, `red-flags.ts`, KPSP scorer, `payment-apply.ts`, signature, age/corrected-age),
  **≥80% lines on `src/lib`**.
- **Golden vectors** for clinical math, derived from the official source (WHO LMS tables, CDC
  ages, KPSP thresholds, IDAI schedule). Mutating a coefficient MUST fail a test.
- **Integration tests** (ephemeral Postgres) prove the authorization matrix: cross-user /
  cross-family access returns 404/403; payment idempotency; admin gating.
- **E2E (Playwright)** for critical journeys: auth, onboarding→first measurement, premium gate,
  share-report, KPSP run. Runs on PRs (core) + nightly (full).
- **Deterministic, no network** in unit/integration; time and randomness injected.
- **A medical/authz/payment change without tests does not merge.** Period.
- **Bug fixes ship with a regression test** that fails before the fix.

---

## 15. UI Consistency Rules

- **shadcn/ui (Radix) primitives only** for base components; don't introduce a second UI kit.
- **Tailwind + brand tokens** from `globals.css`/`tailwind.config.ts`; **no hardcoded hex** in
  components — use tokens. Brand gold is a token, not `#C9A227` sprinkled around.
- **One logo source** (`LogoMark`/`public/brand/logo.svg`) everywhere; don't re-embed variants.
- **Every screen handles four states:** loading (skeleton), empty (guided CTA), error (calm
  Indonesian + retry), and content. Empty states teach the next action, never a dead end.
- **Tone:** warm, calm, supportive; **never alarming** for health content; always "bukan
  diagnosis" where a verdict could worry a parent; **never "Bunda/Bun."**
- **Toasts** via `sonner` for transient feedback; **dialogs** via the `ui/dialog` primitive.
- **Charts** via Recharts with the shared WHO-band pattern (`buildChartData`) — don't re-roll.
- **Mobile-first**, verified down to 414px; tabs scroll horizontally on mobile (existing
  pattern). Admin is responsive too (no desktop-only layouts).

---

## 16. Documentation Rules

- **`PROJECT_CONTEXT.md` is the living log.** Every milestone appends an entry: what changed,
  why, migration number (if any), and the verification gate result. This is non-optional — it
  is how a fresh session (human or AI) re-enters the project.
- **Module-level "why" comments** for non-obvious modules (match `payment-apply.ts`,
  `schema/app.ts`).
- **Public/exported functions** carry a one-line purpose; complex ones explain the algorithm
  and its source (e.g. WHO LMS, KPSP scoring cite the standard).
- **The four canon docs** (`PRD_V2`, `BACKLOG`, `ARCHITECTURE`, this) are updated when reality
  changes — a feature that drifts from them updates them in the same PR.
- **Runbooks** (`DEPLOYMENT.md`) cover env setup, migration, backup/restore, DR.
- **No stale docs:** if a doc names a file/flag that no longer exists, fix it in the PR you
  noticed it.

---

## 17. Deployment Rules

- **Vercel for compute, Neon for DB.** Preview deploy per PR; production deploy is
  operator-gated.
- **Migrations never auto-run in prod.** Operator applies after the PR merges and the preview
  verified the migration. New code is backward-compatible with the pre-migration schema.
- **Env changes are part of the release plan:** the PR/notes list any new env var; production
  envs are set **before** the deploy that needs them; missing required prod env hard-fails boot.
- **Feature flags** wrap risky rollouts (memberships, discounts, offline, CSP-enforce). Default
  off; enable after verification.
- **Capability-gated integrations** can ship "dark" (code present, env unset → 503) and be
  activated later by adding env + redeploy.
- **Rollback** = revert the deploy (stateless compute) + leave the additive migration in place
  (it harms nothing) or flag-off the feature.

---

## 18. Git Workflow

- **Never commit straight to `main` for feature work** — branch (`feat/...`, `fix/...`,
  `chore/...`, `docs/...`). The operator merges/pushes.
- **One verified, gate-green change per commit/cycle.** Don't bundle unrelated changes.
- **Commit messages:** Conventional Commits — `type(scope): summary` in the imperative,
  matching the existing log (`feat(pwa):`, `fix(admin):`, `docs:`). Body explains *why* when
  non-obvious. End commit messages with:
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **No secrets, no `.env`, no `.DS_Store`, no build artifacts** in commits (`.gitignore`
  enforces; don't override it).
- **Rebase/clean history** on a branch is fine; never rewrite shared `main`.
- **Interactive git flags are not used** in this environment.

---

## 19. Pull Request Checklist (author fills this in)

- [ ] Scope is one logical change; title is a Conventional Commit.
- [ ] Gate green locally: `tsc --noEmit` · `npm run lint` (0 errors) · `npm test` (coverage
      holds) · `npm run build`.
- [ ] New/changed logic has tests; medical/authz/payment changes have golden + integration
      tests; the bug fix has a failing-before regression test.
- [ ] DB change is **additive**, has a **migration number**, was applied to a **preview
      branch**, and lists a rollback note. Indexes added for new hot queries.
- [ ] Endpoints go through `resource`/`adminResource` or replicate the three guarantees; inputs
      validated; collections paginated; correct status codes; calm Indonesian errors.
- [ ] AuthZ verified: cross-user/cross-family access is impossible (test proves it).
- [ ] No secret in code/URL/logs; no PII in logs/analytics/Sentry.
- [ ] Privacy: new data class added to export & erasure; consent added if new processing.
- [ ] UI handles loading/empty/error/content; a11y (labels, focus, contrast, reduced-motion);
      no hardcoded hex; no "Bunda"; mobile down to 414px.
- [ ] Analytics events registered in the event registry; no free-text/PII in props.
- [ ] Capability-gated if it depends on an optional integration.
- [ ] Docs updated: `PROJECT_CONTEXT.md` log entry + any canon doc the change affects.
- [ ] Feature-flagged if risky; rollback path stated.

## 20. Code Review Checklist (reviewer enforces)

- [ ] **Authorization** is correct and tested — the #1 thing to break in this product. Confirm
      every new query is identity-scoped; confirm "not yours" returns 404, not 403.
- [ ] **Correctness:** clinical/financial logic matches its cited source; golden tests cover
      boundaries; no `Date.now()`/randomness buried in pure logic.
- [ ] **No source-of-truth duplication** (no new `ACCESS_POLICY`-style drift).
- [ ] **Scale:** no unbounded read, no per-user inline fan-out, indexes present, partitioning
      respected for time-series.
- [ ] **Factory usage:** bespoke CRUD justified; whitelist + validation present.
- [ ] **Security/Privacy:** input validated, output encoded, secrets clean, PII absent from
      logs, consent/export/erasure updated.
- [ ] **Backward compatibility:** runs against old schema; old data still renders; defensive
      hydrate where a table may not be migrated yet.
- [ ] **UI states & a11y & tone** present; brand tokens used.
- [ ] **Tests are meaningful** (would fail if the logic broke), not coverage theater.
- [ ] **Docs** updated; migration number correct and additive.
- [ ] Reviewer can answer "how do we roll this back?" from the PR.

## 21. Release Checklist (per milestone / train)

- [ ] All PRs merged are gate-green; full E2E green.
- [ ] Migrations applied to preview, verified; prod-apply step written for the operator.
- [ ] Required prod env vars set **before** deploy; boot-guard will catch a miss.
- [ ] Feature flags configured (off→on plan).
- [ ] **Clinical sign-off** recorded for any medical change (KPSP/WHO/IDAI/MPASI/corrected age).
- [ ] **Security review** recorded for any authz/payment/media change (mandatory for the
      membership refactor).
- [ ] Observability ready: Sentry release tagged; key analytics events live; alerts armed
      (error rate, queue dead-letter, DB connection saturation, push failure).
- [ ] Backup/restore verified recently; DR runbook current.
- [ ] `PROJECT_CONTEXT.md` updated with the milestone entry; canon docs reconciled.
- [ ] Rollback rehearsed/written for High-risk items.

---

## 22. Definition of Done (global — every task)

A task is **Done** only when **all** hold:
1. Code merged, branch clean, Conventional Commit with the Co-Authored-By trailer.
2. Gate green: `tsc --noEmit` · `npm run lint` (0 errors) · `npm test` (coverage threshold) ·
   `npm run build`.
3. Tests written and meaningful (golden + integration where the category requires).
4. Migration additive, numbered, applied to a preview branch, rollback noted.
5. AuthZ proven (no cross-user/family access); inputs validated; pagination present.
6. Security & privacy satisfied (no secret/PII leaks; export & erasure updated; consent if new
   processing).
7. UI states + a11y + brand consistency; Indonesian, calm, non-alarming, no "Bunda."
8. Analytics events registered; observability wired.
9. Capability-gated if dependent on an optional integration; degrades to 503.
10. Docs updated (`PROJECT_CONTEXT.md` + affected canon docs).
11. Sign-off obtained where required (clinical / security).
12. Deployed to preview; operator has the prod migrate + env steps; rollback path exists.

---

## 23. Forbidden — never do these

1. **Never merge with a red gate.** No "I'll fix the test/types after."
2. **Never trust the client** for identity, role, plan, price, or a verdict.
3. **Never write a DB query without an identity scope** on user/child data. No `select * from
   table` returned to a user.
4. **Never hand-roll auth, sessions, or password hashing** — Better Auth only.
5. **Never put a secret in client code, a URL, a query string, or a log.** (Gemini key → header.)
6. **Never log or send to analytics/Sentry/AI** a child's name, journal text, coach text, or
   any PII.
7. **Never do a destructive migration** (drop/rename/narrow) without an expand-contract plan +
   sign-off. No editing past migration files.
8. **Never auto-migrate production** from a PR. The operator migrates.
9. **Never duplicate a source of truth** (no second `ACCESS_POLICY`; admin-editable facts live
   in the DB and are seeded, not mirrored).
10. **Never load "everything"** on app open, and **never loop per-user inline** for fan-out —
    use windowed reads and the queue.
11. **Never present health content as diagnosis.** Always calm, evidence-based, "consult a
    health worker," never alarming.
12. **Never use `dangerouslySetInnerHTML` on user content**, and never bypass CSP with an inline
    script/style without a nonce + review.
13. **Never hardcode hex colors, copy "Bunda/Bun," or introduce a second UI kit / second logo
    source.**
14. **Never ship a medical, authorization, or payment change without tests** and the required
    sign-off.
15. **Never commit `.env`, secrets, build artifacts, or `.DS_Store`.**
16. **Never break backward compatibility** for existing users' data or saved state.
17. **Never add an integration without capability-gating** (`xConfigured()` + 503 fallback).
18. **Never skip the `PROJECT_CONTEXT.md` log entry** for a shipped milestone.

---

## 24. The One-Paragraph Summary

Build additively, one verified feature at a time. Authorize everything on the server, scoped by
identity. Keep clinical and financial logic pure and covered by golden tests. Use the factories
and the column helpers; don't reinvent scoping. Validate inputs, paginate reads, index hot
queries, fan out work through the queue. Degrade gracefully behind capability gates. Treat
children's data as sacred — minimize, consent, encrypt, expire, export, erase, and never leak
it to a log. Keep the UI calm, accessible, Indonesian, and on-brand. Keep the gate green, the
docs current, and the history honest. When in doubt, make it look like the `resource()` factory
wrote it.
```
