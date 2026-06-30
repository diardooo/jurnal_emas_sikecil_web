# Engineering Backlog — Jurnal Emas Si Kecil v2

**Companion to:** `PRD_V2.md` • **Methodology:** Agile Scrum • **Last updated:** 2026-06-30

This backlog converts every PRD requirement into engineering tasks, sorted in
**implementation order** (top = build first). It maps 1:1 to the PRD's milestone plan
(M59→) and migration numbering (next free = **0013**) and uses the existing codebase
conventions (`resource()`/`adminResource()` factories, `ACCESS_POLICY`, `whoZScore`, etc.).

---

## Scrum Operating Model (assumptions)

| Parameter | Value |
|---|---|
| Sprint length | 2 weeks |
| Team | ~6 engineers (2 FE, 2 BE, 1 full-stack, 1 QA) + 1 clinical reviewer (fractional) |
| Assumed velocity | ~40 SP / sprint |
| Story points | Fibonacci (1,2,3,5,8,13) |
| SP→hours guide | 1≈3h · 2≈6h · 3≈10h · 5≈18h · 8≈30h · 13≈50h (focused eng hours, incl. tests) |
| Complexity | XS / S / M / L / XL |
| Risk | Low / Med / High |
| Priority | P0 (blocker) · P1 · P2 · P3 |
| Definition of Done (global) | code + tests green · `tsc`+`lint`+`build` clean · `npm test` ≥ coverage gate · additive migration applied to a Neon preview branch · analytics events registered · a11y smoke pass · PR reviewed · docs/PROJECT_CONTEXT log updated · deployed to preview · product/clinical sign-off where required |

**Global ticket ID scheme:** `JES-<n>`. **Sprint mapping** is in §"Sprint Plan" at the end.

**Card format** (every task carries all required fields):
`ID · Title` → Epic · Feature · Story · Task · Subtasks · Priority · Deps · SP · Hours ·
Complexity · DB · API · FE · BE · Testing · DoD-delta · Acceptance · Risk.

> Cards for v1.1/v1.2/v1.5 are at full granularity. v2.0/v3.0 cards are epic+task level
> (their PRDs are lighter) and expand to full granularity when pulled into a sprint.

---

# EPIC E0 — Trustworthy & Safe Foundations (PRD v1.1)

> Goal: 0 P0 risks open; safe to scale & take money. **Must complete before clinical/medical
> or monetization epics.**

## Feature F0.2 — Production Env Hardening (do first; trivial, unblocks safety)

### JES-101 · Add `assertProdEnv()` boot guard
- **Epic:** E0 · **Feature:** F0.2 · **Story:** As an operator, a misconfigured prod deploy
  fails fast & loud instead of silently insecure.
- **Task:** Central env assertion run on server bootstrap.
- **Subtasks:** (1) `src/lib/env.ts` with `assertProdEnv()` validating `BETTER_AUTH_SECRET`
  (≥32 chars, ≠ default), `BETTER_AUTH_URL` (https), `DATABASE_URL` present; (2) invoke from
  server entry (instrumentation hook / `db` + `auth` init); (3) remove insecure defaults in
  `lib/auth.ts` for prod, keep dev/demo fallback; (4) update `DEPLOYMENT.md` runbook; (5)
  rotate current prod secret.
- **Priority:** P0 · **Deps:** none · **SP:** 3 · **Hours:** ~10 · **Complexity:** S
- **DB:** none · **API:** none · **FE:** none · **BE:** boot guard, auth.ts edit
- **Testing:** unit — missing/short/default secret throws in `production`, passes in dev;
  https-only check.
- **DoD-delta:** verified on a preview deploy with a deliberately-missing env (build fails).
- **Acceptance:** prod boot with default/missing secret → hard fail logged; dev unchanged.
- **Risk:** Low (intended hard-fail).

## Feature F0.1 — Test Harness on Safety-Critical Logic (prerequisite for ALL math)

### JES-102 · Stand up Vitest + coverage + CI stage
- **Epic:** E0 · **Feature:** F0.1 · **Story:** As an engineer, I get fast feedback when I
  break core logic.
- **Task:** Configure Vitest, coverage thresholds, `npm test`, add CI stage.
- **Subtasks:** (1) install/config Vitest + c8 coverage; (2) `npm test` script; (3) thresholds
  (≥80% `src/lib`, 100% math/safety modules); (4) add `npm test` to `.github/workflows/ci.yml`
  before build; (5) coverage report artifact.
- **Priority:** P0 · **Deps:** none · **SP:** 3 · **Hours:** ~10 · **Complexity:** S
- **DB:** none · **API:** none · **FE:** none · **BE:** tooling
- **Testing:** meta — seed a deliberate bug, CI goes red.
- **DoD-delta:** CI blocks on failing test/coverage drop.
- **Acceptance:** `npm test` runs <3 min; CI fails on red.
- **Risk:** Low.

### JES-103 · Golden test vectors for WHO z-scores (`who.ts`)
- **Epic:** E0 · **Feature:** F0.1 · **Story:** As a clinician-trust owner, z-scores are
  provably correct.
- **Task:** Unit tests for `whoZScore`, `classifyWho`, `zToPercentile`, `buildChartData`.
- **Subtasks:** (1) derive ≥30 vectors from official WHO LMS (boundaries z=−3,−2,0,+2,+3 +
  tail extrapolation) both sexes, all metrics; (2) percentile approximation accuracy test;
  (3) age 0/60/out-of-range/value≤0 → null; (4) chart band correctness.
- **Priority:** P0 · **Deps:** JES-102 · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** none · **API:** none · **FE:** none · **BE:** tests only
- **Testing:** this is the test; cross-checked vs published WHO percentile examples.
- **DoD-delta:** clinical reviewer confirms ≥3 spot vectors.
- **Acceptance:** all vectors pass; mutating a coefficient fails a test.
- **Risk:** Low (high value).

### JES-104 · Tests for red-flags, coach-context, payment, signature
- **Epic:** E0 · **Feature:** F0.1 · **Story:** Safety & revenue logic is regression-proof.
- **Task:** Unit tests for `red-flags.ts`, `coach-context.ts`, `payment-apply.ts`,
  `midtrans.verifySignature`, `getAge`.
- **Subtasks:** (1) regression flagged at any age, overdue only past window, ordering; (2)
  coach context grounding/format snapshot; (3) payment idempotency (dup settlement no
  day-stack; failed renewal no downgrade); (4) signature pass/fail; (5) age math incl leap/tz.
- **Priority:** P0 · **Deps:** JES-102 · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** none · **API:** none · **BE:** tests
- **Testing:** deterministic, no network.
- **Acceptance:** all green; seeded bug in `applyOrderOutcome` fails.
- **Risk:** Low.

### JES-105 · Integration tests: factory ownership scoping
- **Epic:** E0 · **Feature:** F0.1 · **Story:** Cross-user/child access is provably impossible.
- **Task:** Integration tests against ephemeral Postgres (pglite/testcontainers) for
  `resource()` + `adminResource()` + `ownsChild` + `getAdmin`.
- **Subtasks:** (1) test DB harness + migrations; (2) user B cannot GET/PATCH/DELETE user A
  rows → 404; (3) POST with foreign childId → 400; (4) non-admin → 403 on admin routes;
  (5) suspended/demoted admin loses access immediately.
- **Priority:** P0 · **Deps:** JES-102 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** test only · **API:** exercised · **BE:** harness
- **Testing:** the authorization matrix.
- **Acceptance:** full matrix green; a deliberately removed `userId` filter fails a test.
- **Risk:** Med (harness setup).

## Feature F0.4 — Observability & Analytics

### JES-106 · Sentry (server+client) with PII scrubbing
- **Epic:** E0 · **Feature:** F0.4 · **Story:** As eng, prod errors are visible within minutes.
- **Task:** Integrate Sentry with release tagging + scrubbing.
- **Subtasks:** (1) init server + client; (2) release/version tag; (3) PII deny-list
  (journal/coach text, names, emails); (4) sample-rate config; (5) source maps.
- **Priority:** P1 · **Deps:** none · **SP:** 3 · **Hours:** ~10 · **Complexity:** S
- **DB:** none · **API:** wraps handlers · **FE:** root layout init
- **Testing:** thrown error appears scrubbed in Sentry (staging).
- **Acceptance:** errors captured; no PII in payloads.
- **Risk:** Low.

### JES-107 · `track()` wrapper + event registry
- **Epic:** E0 · **Feature:** F0.4 · **Story:** Product can measure funnels.
- **Task:** `src/lib/analytics/{track,events}.ts` + wire first 15 core events.
- **Subtasks:** (1) typed `track(event,props)` (Vercel/PostHog-compatible); (2) canonical
  `events.ts` registry; (3) required props (hashed userId, plan, ageBucket, surface); (4)
  free-text deny-list; (5) wire onboarding/growth/coach/billing events; (6) cookie-consent gate.
- **Priority:** P1 · **Deps:** none · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** none · **API:** none · **FE:** event calls · **BE:** server events
- **Testing:** unit — unregistered event rejected; PII stripped.
- **Acceptance:** 15 events flowing to dashboard; no PII.
- **Risk:** Low.

## Feature F0.5 — Content Security Policy

### JES-108 · CSP report-only → enforce
- **Epic:** E0 · **Feature:** F0.5 · **Story:** Close client-side injection class.
- **Task:** Add CSP to `securityHeaders`, report-only first.
- **Subtasks:** (1) allow-list (Cloudinary, Google OAuth, Vercel, self) + style nonce; (2)
  report-only + report endpoint; (3) audit user-text render paths for `dangerouslySetInnerHTML`
  (expect none); (4) 1–2 wk soak; (5) flip to enforce (JES-109 follow-up).
- **Priority:** P1 · **Deps:** none · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** none · **API:** header config · **FE:** nonce wiring
- **Testing:** E2E smoke — images/auth/OAuth unaffected under report-only.
- **Acceptance:** clean reports for soak window; enforce ships with no regressions.
- **Risk:** Med (over-strict breakage) → report-only mitigates.

## Feature F0.3 — Upload Hardening + Moderation

### JES-110 · Server-derived folder + EXIF strip + MIME magic-byte
- **Epic:** E0 · **Feature:** F0.3 · **Story:** My child's photo stays private & safe.
- **Task:** Harden `/api/upload` and `lib/cloudinary.ts`.
- **Subtasks:** (1) derive `folder = jurnal-emas/{user.id}/{purpose}` server-side, ignore
  client; (2) strip EXIF GPS; (3) magic-byte validation (not just `file.type`); (4) dimension
  cap; (5) keep Premium gate (`PREMIUM_PURPOSES`).
- **Priority:** P0 · **Deps:** none · **SP:** 3 · **Hours:** ~10 · **Complexity:** S
- **DB:** none · **API:** upload route · **BE:** cloudinary lib
- **Testing:** unit — folder cannot be overridden; spoofed MIME rejected.
- **Acceptance:** client folder ignored; EXIF GPS absent on stored asset.
- **Risk:** Low.

### JES-111 · Cloudinary moderation + callback + per-user quota
- **Epic:** E0 · **Feature:** F0.3 · **Story:** Illegal/abusive content is blocked & reported.
- **Task:** Enable moderation, async approval flow, daily quota.
- **Subtasks:** (1) enable moderation on upload; (2) `media_assets` table (status); (3)
  signed `POST /api/upload/moderation-callback` to approve/reject/delete; (4) hide pending,
  reveal on approval; (5) `upload_usage` daily counter (count+bytes) like `coachUsage`; (6)
  manual-review/appeal note in admin; (7) legal CSAM-reporting hook (ops runbook).
- **Priority:** P0 · **Deps:** JES-110 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** **migration 0013** — `media_assets`, `upload_usage` (additive)
- **API:** upload + moderation-callback · **FE:** "processing" optimistic state
- **Testing:** integration — rejected asset returns 422, never yields URL; quota blocks abuse;
  callback signature verified.
- **Acceptance:** flagged content blocked; quota enforced; appeal path documented.
- **Risk:** Med (false positives) → manual review.

## Feature F0.6 — Email Verification + i18n Layer

### JES-112 · Turn on email verification (gated by Resend)
- **Epic:** E0 · **Feature:** F0.6 · **Story:** Accounts use real, owned emails.
- **Task:** `requireEmailVerification: true`; gate sensitive actions; backfill existing users.
- **Subtasks:** (1) enable once `RESEND_API_KEY` set; (2) resend-verification flow; (3) grace
  browse, block share-link + checkout until verified; (4) **migration 0014** backfill existing
  users `emailVerified=true`; (5) Indonesian email templates (no "Bunda").
- **Priority:** P0 · **Deps:** Resend active · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** **migration 0014** (backfill) · **API:** auth flow · **FE:** verify UI/banner
- **Testing:** E2E — unverified blocked from gated actions; verified passes; existing user
  grandfathered.
- **Acceptance:** new signup verifies; legacy users unaffected.
- **Risk:** Med (deliverability) → resend + grace.

### JES-113 · i18n string layer (`t(key)`) for new strings
- **Epic:** E0 · **Feature:** F0.6 · **Story:** Future strings externalized.
- **Task:** Lightweight `t()` (ID default) + lint rule for new components.
- **Subtasks:** (1) `src/lib/i18n/`; (2) ID dictionary; (3) refactor v1.1 new strings; (4)
  best-effort lint hint against new hardcoded strings.
- **Priority:** P2 · **Deps:** none · **SP:** 3 · **Hours:** ~10 · **Complexity:** S
- **DB:** none · **FE:** string refactor
- **Testing:** unit — missing key fallback.
- **Acceptance:** new strings via `t()`; no behavior change.
- **Risk:** Low.

## Feature F0.7 — Soft-Delete & Export-Before-Delete

### JES-114 · Soft-delete for children + account
- **Epic:** E0 · **Feature:** F0.7 · **Story:** I can undo deletes; I never lose memories.
- **Task:** `deletedAt` soft-delete + restore + 30-day purge job; export-before-delete.
- **Subtasks:** (1) **migration 0015** add `children.deletedAt`, user `pending_delete`; (2)
  add `isNull(deletedAt)` to relevant `resource()` reads; (3) Trash UI in Settings + restore;
  (4) account delete forces export download or explicit skip; (5) purge cron after 30d; (6)
  retain immediate hard-erasure option (UU PDP).
- **Priority:** P1 · **Deps:** JES-105 (scoping tests) · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** **migration 0015** (additive) · **API:** delete/restore + purge · **FE:** Trash + export gate
- **Testing:** integration — soft-deleted hidden everywhere; restore works; purge after 30d;
  immediate-erasure still hard-deletes.
- **Acceptance:** accidental delete recoverable ≤30d; export offered; erasure honored.
- **Risk:** Med (data lingering) → bounded purge.

---

# EPIC E1 — Clinically Credible (PRD v1.2)

> Goal: pediatrician/Posyandu trust. **All math gated by E0 JES-102/103.** Requires clinical
> sign-off (per-train gate).

## Feature F1.3 — Corrected Age (build before KPSP)

### JES-201 · Gestational age + `getCorrectedAge` everywhere
- **Epic:** E1 · **Feature:** F1.3 · **Story:** Preemie parents aren't falsely alarmed.
- **Task:** Optional gestational weeks; effective-age used by growth/milestones/KPSP/red-flags
  until 24 mo.
- **Subtasks:** (1) **migration 0018** `children.gestationalWeeks`; (2) pure
  `getCorrectedAge(dob, weeks)`; (3) thread effective age into `classifyWho` callers,
  `evaluateRedFlags`, KPSP form selection; (4) "usia koreksi" badge + explainer; (5) revert
  to chronological at ≥24 mo.
- **Priority:** P1 · **Deps:** JES-103 · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** **0018** additive · **API:** children PATCH (field) · **FE:** profile field + badge
- **Testing:** unit — correction math, 24-mo cutoff, term=no-correction.
- **Acceptance:** preemie <24mo uses corrected age across all consumers; null = chronological.
- **Risk:** Med (scientific) → tests + review.

## Feature F1.2 — Complete WHO Indicators (WHZ / BMI-for-age)

### JES-202 · Generate WFL/WFH LMS tables + length-indexed interpolation
- **Epic:** E1 · **Feature:** F1.2 · **Story:** Wasting/overweight is detected (WHO-complete).
- **Task:** Extend `who-lms.ts` generator + `who.ts` with length/height-indexed WHZ + BMI-for-age.
- **Subtasks:** (1) regenerate LMS for weight-for-length(0–24)/weight-for-height(24–60) both
  sexes from WHO source; (2) `lmsAtByLength()` (key = cm, not age); (3) `classifyWho("wasting"|
  "bmi", …)` with bands (<−3 severe, <−2 wasting, >+2 overweight, >+3 obese); (4) keep
  age-indexed path untouched; (5) surface in coach context + growth UI.
- **Priority:** P1 · **Deps:** JES-103 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** optional cache cols **migration 0017** (additive) · **API:** none new · **FE:** growth UI status+chart
- **Testing:** golden WHZ vectors from WHO tables; length-interpolation boundaries.
- **Acceptance:** wasting status computed from weight+height; backward-compatible.
- **Risk:** High (scientific) → vectors + citation + review.

## Feature F1.1 — KPSP Screening Module

### JES-203 · KPSP content model + seed + scorer
- **Epic:** E1 · **Feature:** F1.1 · **Story:** Screen development with the standard my bidan uses.
- **Task:** Reference questions, deterministic scorer, age-window selector.
- **Subtasks:** (1) **migration 0016** `ref_kpsp_questions` (+version) & `kpsp_screenings`;
  (2) `scripts/seed-kpsp.ts` verbatim from official SDIDTK source (versioned, idempotent);
  (3) pure `scoreKpsp(answers)` → S/M/P; (4) `selectKpspForm(ageMonths)` with rounding rule;
  (5) corrected-age input (dep JES-201).
- **Priority:** P1 · **Deps:** JES-103, JES-201 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** **0016** additive + seed · **API:** (next) · **BE:** scorer/selector
- **Testing:** golden — threshold boundaries (yaCount 6/7/8/9) every band; selection rule;
  corrected-age path.
- **Acceptance:** correct form per age; exact S/M/P; clinical sign-off on transcription.
- **Risk:** **High (scientific)** → verbatim + review + tests + versioning.

### JES-204 · KPSP API (server-side scoring) + admin CRUD
- **Epic:** E1 · **Feature:** F1.1 · **Task:** Endpoints for form/run/history + admin content.
- **Subtasks:** (1) `GET /api/kpsp/form?childId=` (due + closest form); (2) `POST
  /api/kpsp/screenings` (scores server-side, persists immutable); (3) `GET /api/kpsp/
  screenings?childId=`; (4) `adminResource(ref_kpsp_questions)` under `/api/admin/content/kpsp`;
  (5) ownership + admin gates.
- **Priority:** P1 · **Deps:** JES-203 · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** uses 0016 · **API:** 4 routes · **BE:** handlers
- **Testing:** integration — server scoring can't be spoofed; ownership; admin gate.
- **Acceptance:** verdict computed server-side; history immutable; re-screen = new row.
- **Risk:** Med.

### JES-205 · KPSP UI flow + result + Zustand slice + reminders
- **Epic:** E1 · **Feature:** F1.1 · **Story:** Answer simple Ya/Tidak, see result + next step.
- **Task:** Stepper UI, result card, due prompt, re-screen reminder.
- **Subtasks:** (1) one-question-per-screen stepper (mobile) + result S/M/P (color+icon+text);
  (2) calm referral card for P (reuse red-flag tone, "bukan diagnosis"); (3) dashboard "KPSP
  due" prompt; (4) `kpsp` store slice (due/history, optimistic, defensive hydrate); (5) +14d
  re-screen reminder for M (via notifications/F-INFRA-2 later); (6) out-of-range explainer;
  (7) resume partial.
- **Priority:** P1 · **Deps:** JES-204 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** none · **API:** consumes · **FE:** pages/dialog/slice
- **Testing:** E2E run-through all results; a11y (radio groups, keyboard, SR); empty/loading.
- **Acceptance:** full run S/M/P with correct guidance; answers never lost on flaky net.
- **Risk:** Med.

## Feature F1.4 — Immunization Engine + Reminders

### JES-206 · IDAI schedule engine + due/overdue + reminders
- **Epic:** E1 · **Feature:** F1.4 · **Story:** Never miss a vaccine.
- **Task:** Seed full IDAI schedule per DOB, compute due, catch-up, reminders.
- **Subtasks:** (1) version `ref_immunizations` (**migration 0019**); (2) seed latest IDAI
  schedule (versioned, clinician-reviewed); (3) due-date compute from DOB on child create;
  (4) `GET /api/immunizations/due?childId=`; (5) catch-up suggestions; (6) reminders (cron now,
  queue later); (7) dashboard next-due/overdue card.
- **Priority:** P1 · **Deps:** JES-201 (corrected age optional) · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** **0019** additive · **API:** due route · **FE:** due card · **BE:** engine
- **Testing:** unit — schedule per DOB, catch-up; integration — due route.
- **Acceptance:** correct IDAI schedule; due/overdue accurate; admin-updatable without deploy.
- **Risk:** Med-High (scientific) → source + version + review.

## Feature F1.5 — Clinician Report + Hardened Share

### JES-207 · Clinician-grade report (server PDF) + share PIN/revoke
- **Epic:** E1 · **Feature:** F1.5 · **Story:** Bring a report my pediatrician respects.
- **Task:** Server-rendered report (growth curves, z-scores, KPSP, immun, red flags) + PIN +
  revoke on share.
- **Subtasks:** (1) report renderer (growth charts + WHZ/WAZ/HAZ/HCZ + latest KPSP + immun
  completeness + red-flag summary + disclaimer); (2) PDF/print route; (3) **migration 0020**
  `report_shares.pinHash`, `revokedAt`; (4) PIN check in `/api/public/report/[token]`; (5)
  `DELETE /api/reports/share/[id]` revoke; (6) keep Premium-gate to create.
- **Priority:** P1 · **Deps:** JES-203/206 (content), JES-202 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** **0020** additive · **API:** report/share/public · **FE:** report view + share dialog
- **Testing:** integration — expired/wrong-PIN/revoked blocked; minimal data exposure;
  snapshot of report content.
- **Acceptance:** clinical report generates; public link enforces token+expiry+PIN+revoke.
- **Risk:** Med.

### JES-208 · E1 clinical sign-off & E2E gate
- **Epic:** E1 · **Feature:** (train gate) · **Task:** Clinical reviewer signs KPSP/IDAI/WHZ;
  full E2E green.
- **Priority:** P0 (release gate) · **Deps:** JES-203/206/202 · **SP:** 3 · **Hours:** ~10
- **Testing:** E2E clinical flows; reviewer checklist archived.
- **Acceptance:** signed sign-off recorded; E2E green. · **Risk:** Med.

---

# EPIC E2 — Daily Companion (PRD v1.5)

> Goal: a daily loop. Reminder-heavy features depend on the durable queue.

## Feature F-INFRA-2 — Durable Job/Reminder Queue

### JES-301 · Job queue + idempotent worker; convert digest to fan-out
- **Epic:** E2 · **Feature:** F-INFRA-2 · **Story:** Reminders scale & never double-fire.
- **Task:** `scheduled_jobs` + worker (QStash/Vercel Queue/table-poll) + refactor
  `morning-digest` to enqueue.
- **Subtasks:** (1) **migration 0021** `scheduled_jobs`; (2) enqueue API + worker w/ retries +
  idempotency keys; (3) refactor digest loop → fan-out enqueue; (4) preserve dead-sub pruning;
  (5) dead-letter handling.
- **Priority:** P1 · **Deps:** E0 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** **0021** additive · **API:** enqueue/worker · **BE:** queue
- **Testing:** integration — at-least-once + dedupe; retry on transient failure.
- **Acceptance:** digest fan-out; no dup notifications under retries.
- **Risk:** High → idempotency + dedupe.

## Feature F2.0 — Daily Care Logging (Feed / Sleep / Diaper)

### JES-302 · Feed logging (timer + quick-add) + windowed queries
- **Epic:** E2 · **Feature:** F2.0 · **Story:** Log feeds one-handed at 3 a.m.
- **Subtasks:** (1) **migration 0022** `feed_logs`; (2) `resource(feed_logs)`; (3) timer state
  surviving reload; (4) `feed` store slice **windowed by date range (NOT global hydrate)**;
  (5) daily/weekly summary; (6) edit/delete; (7) analytics `care.feed_logged`.
- **Priority:** P1 · **Deps:** JES-301 (reminders opt) · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** **0022** additive (+index childId,at) · **API:** feed CRUD · **FE:** quick-add+timer+summary
- **Testing:** unit summary/tz boundaries; integration ownership; timer persistence.
- **Acceptance:** 1-tap log; summaries correct; history paginated.
- **Risk:** Med (friction) → obsess 1-tap.

### JES-303 · Diaper logging
- **Epic:** E2 · **Feature:** F2.0 · **Subtasks:** **migration 0023** `diaper_logs`;
  `resource()`; `diaper` slice (windowed); quick-add; analytics.
- **Priority:** P2 · **Deps:** JES-302 · **SP:** 3 · **Hours:** ~10 · **Complexity:** S
- **DB:** **0023** · **API:** CRUD · **FE:** quick-add · **Testing:** ownership + summary.
- **Acceptance:** pee/poo/mixed logged & summarized. · **Risk:** Low.

### JES-304 · Sleep logging extension (start/end timestamps, nap/night)
- **Epic:** E2 · **Feature:** F2.0 · **Subtasks:** extend `sleep_logs` (start/end, kind),
  keep legacy hours; derive hours when present; timer; backward-compatible render.
- **Priority:** P2 · **Deps:** JES-302 · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** **migration (0023b)** additive · **API:** sleep route · **FE:** timer+summary
- **Testing:** legacy hours-only rows still render; derive correctness.
- **Acceptance:** precise sleep + legacy compatible. · **Risk:** Med.

## Feature F2.1 — Sleep Insight (nap-window suggestion)

### JES-305 · `suggestNapWindow` heuristic + UI
- **Epic:** E2 · **Feature:** F2.1 · **Story:** When should baby nap next?
- **Subtasks:** (1) pure `suggestNapWindow(ageMonths, recentSleep)` (age wake-windows + ranges
  from `ref_sleep`); (2) cold-start age-based default; (3) UI range + confidence + disclaimer;
  (4) free basic / premium personalized.
- **Priority:** P2 · **Deps:** JES-304 · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** none · **API:** compute (server or client) · **FE:** insight card
- **Testing:** unit — windows by age; no-suggestion under min data.
- **Acceptance:** sensible range, never a command. · **Risk:** Med (scientific/UX) → range+disclaimer.

## Feature F2.2 — MPASI Planner & Nutrition

### JES-306 · MPASI content + stages + allergen tracker
- **Epic:** E2 · **Feature:** F2.2 · **Story:** Feed my baby right to prevent stunting.
- **Subtasks:** (1) **migrations 0024+** `ref_mpasi_stages`, `ref_recipes` (versioned, global),
  `allergen_log` (user/child); (2) seed (clinician-reviewed, local ingredients, safety/choke
  notes); (3) age-based schedule from 6 mo; (4) low-WAZ/WHZ → gentle nutrition surfacing; (5)
  free basics / premium full library.
- **Priority:** P2 · **Deps:** JES-202 (WHZ) · **SP:** 13 · **Hours:** ~50 · **Complexity:** XL
- **DB:** **0024+** additive · **API:** content read + allergen CRUD · **FE:** planner+library+tracker
- **Testing:** unit schedule; integration allergen ownership; content review checklist.
- **Acceptance:** age-appropriate MPASI + allergen tracking; safety prominent; no medical claims.
- **Risk:** **High (scientific: allergen/choke)** → review + safety notes; ship read-only first.

## Feature F2.3 — Weekly Digest & Proactive Insights

### JES-307 · Insight rules engine + weekly digest
- **Epic:** E2 · **Feature:** F2.3 · **Story:** A weekly nudge worth reading.
- **Subtasks:** (1) deterministic insight rules (immun overdue, growth not measured, KPSP due,
  journal highlights) reusing `buildCoachContext`; (2) optional LLM summary; (3) weekly
  email/push via queue; (4) dashboard proactive cards; (5) frequency caps + prefs/opt-out.
- **Priority:** P2 · **Deps:** JES-301 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **DB:** prefs (reuse settings) · **API:** digest job · **FE:** insight cards + prefs
- **Testing:** unit rules; integration digest generation; opt-out respected.
- **Acceptance:** grounded weekly digest; proactive cards; no fatigue (caps).
- **Risk:** Med (fatigue) → caps.

## Feature F2.4 — Memory Resurfacing & Celebration Share

### JES-308 · Celebration moments + shareable card (privacy-safe)
- **Epic:** E2 · **Feature:** F2.4 · **Story:** Celebrate & share milestones beautifully.
- **Subtasks:** (1) "Setahun lalu" cards (extend `resurfaceMemory`); (2) milestone-achieved
  animation (respect `prefers-reduced-motion`); (3) server-generated share image (default
  excludes full name/face unless opt-in, watermark, no public index); (4) analytics.
- **Priority:** P2 · **Deps:** JES-111 (media moderation) · **SP:** 5 · **Hours:** ~18 · **Complexity:** M
- **DB:** none · **API:** share-image gen · **FE:** celebration + share
- **Testing:** a11y reduced-motion; privacy default excludes PII; image gen snapshot.
- **Acceptance:** celebratory + shareable; conservative privacy defaults.
- **Risk:** Med (child images) → opt-in defaults.

---

# EPIC E3 — Family & Network (PRD v2.0) — epic+task level

## Feature F3.1 — Multi-Caregiver Memberships (highest-risk refactor)

### JES-401 · Phase 1: membership read-through (behavior-identical)
- **Epic:** E3 · **Feature:** F3.1 · **Story:** Foundation for family access without user-visible change.
- **Task:** Introduce `child_members`; replace `ownsChild`/`userId` checks with
  `canAccessChild(userId, childId, minRole)`; backfill owner memberships.
- **Subtasks:** (1) **migration 0030** `child_members`, **0031** backfill owners from
  `children.userId`; (2) `canAccessChild`; (3) switch all child-scoped factory queries to
  membership read-through behind a flag; (4) keep non-child user data user-owned.
- **Priority:** P1 · **Deps:** E0 JES-105 (authz tests) · **SP:** 13 · **Hours:** ~50 · **Complexity:** XL
- **DB:** **0030/0031** additive · **API:** all child-scoped routes · **BE:** authz core
- **Testing:** **full authz matrix** (role×action×resource); backfill correctness; behavior
  identical to pre-change (regression suite).
- **DoD-delta:** security review sign-off.
- **Acceptance:** every child has exactly its owner; zero behavior change; flag toggles cleanly.
- **Risk:** **High (cross-family leak)** → phased + matrix tests + sec review; rollback = flag off.

### JES-402 · Phase 2: invites + roles UI
- **Epic:** E3 · **Feature:** F3.1 · **Task:** `child_invites`, accept flow, roles
  (owner/editor/viewer), revoke, child switcher shows shared.
- **Subtasks:** invite token (unguessable+expiring); accept (requires verified email);
  role assignment owner-only; revoke immediate; consent screen.
- **Priority:** P1 · **Deps:** JES-401, JES-112 · **SP:** 13 · **Hours:** ~50 · **Complexity:** XL
- **DB:** **migration 0030b** `child_invites` · **API:** invites/members routes · **FE:** invite/manage UI
- **Testing:** privilege-escalation prevented; revoke immediacy; expiry.
- **Acceptance:** co-caregiver can be invited, scoped by role, revoked instantly.
- **Risk:** High → role checks server-side every write.

## Feature F3.2 — Tiers, Family Plan, Working Discounts

### JES-403 · Tiered plans + family + wire discounts + matrix-as-source-of-truth
- **Epic:** E3 · **Feature:** F3.2 · **Story:** Real promos + honest admin tools + higher ARPU.
- **Subtasks:** (1) plans Lite/Emas/Keluarga + limits map; (2) **migration 0032** `plan='family'`;
  (3) `/api/payment/snap` applies validated discount to `gross_amount` (active/not-expired/
  under maxUsage); (4) atomic `usedCount++` tied to settlement in `applyOrderOutcome`; (5)
  make `role_permissions` authoritative (seed from `ACCESS_POLICY`, gates read DB matrix w/
  code fallback) — resolves documented drift; (6) rate-limit code validation.
- **Priority:** P1 · **Deps:** JES-401 (family seats), JES-104 (payment tests) · **SP:** 13 · **Hours:** ~50 · **Complexity:** XL
- **DB:** **0032** additive · **API:** snap/discount/admin · **FE:** pricing/tiers UI
- **Testing:** server-side price+discount; idempotent usage increment; brute-force limited.
- **Acceptance:** discounts actually reduce price once; family seats enforced; admin matrix
  drives enforcement (no drift).
- **Risk:** High (revenue) → server compute + tests.

## Feature F3.3 — Buku Emas Keepsake + Offline Sync

### JES-404 · Buku Emas (digital annual keepsake PDF)
- **Epic:** E3 · **Feature:** F3.3 · **Deps:** JES-111, JES-207 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **Subtasks:** annual photo-book PDF (milestones/journal highlights/growth); premium artifact;
  print partner later. · **DB:** none · **API:** book gen · **FE:** preview/order
- **Testing:** content snapshot; premium gate. · **Acceptance:** digital keepsake generates. · **Risk:** Med.

### JES-405 · Offline-first sync (service worker + write queue)
- **Epic:** E3 · **Feature:** F3.3 · **Deps:** JES-302 · **SP:** 13 · **Hours:** ~50 · **Complexity:** XL
- **Subtasks:** extend SW to cache shell + queue writes; reconcile (LWW per field + server ts);
  bounded offline window. · **Testing:** conflict resolution; offline→online reconcile.
- **Acceptance:** reliable offline logging syncs cleanly. · **Risk:** High → LWW + bounded window.

## Feature F3.4 — Posyandu / Buku KIA Bridge

### JES-406 · Buku KIA structured export → import
- **Epic:** E3 · **Feature:** F3.4 · **Deps:** JES-203/206/202 · **SP:** 8 · **Hours:** ~30 · **Complexity:** L
- **Subtasks:** export growth/immun/KPSP matching Buku KIA sections (PDF/CSV); import later;
  partnership track for official integration. · **Acceptance:** export aligns with Buku KIA. · **Risk:** Med.

### JES-407 · E3 security review (membership authz focus) + release gate
- **Epic:** E3 · **Priority:** P0 (gate) · **Deps:** JES-401/402/403 · **SP:** 3 · **Hours:** ~10
- **Acceptance:** sec review signs off cross-family isolation; E2E green. · **Risk:** High.

---

# EPIC E4 — Platform (PRD v3.0) — concept-level placeholders

| ID | Feature | Task | Deps | SP (rough) | Risk |
|---|---|---|---|---|---|
| JES-501 | F4.1 B2B portal | Clinic/Posyandu accounts, cadre batch KPSP, aggregate dashboards | JES-401, E1 | 40+ | High |
| JES-502 | F4.2 Vision milestone tagging | Photo→milestone suggest, consent-gated | JES-111 | 21 | High |
| JES-503 | F4.3 More validated screens | TDD/TDL, M-CHAT, GPPH/SDQ | JES-203 pattern | 21 | High |
| JES-504 | F4.4 Population insights | Privacy-preserving aggregate stunting/growth | consent + de-id | 21 | High |

> E4 cards expand to full granularity (all 19 fields) when prioritized into a sprint.

---

# Dependency-Ordered Master List (build top→bottom)

```
E0: 101 → 102 → 103,104 → 105 → 106,107 → 108(/109) → 110 → 111 → 112 → 113 → 114
E1: 201 → 202 → 203 → 204 → 205 ; 206 ; 207 → 208(gate)
E2: 301 → 302 → 303,304 → 305 ; 306 ; 307 ; 308
E3: 401 → 402 ; 403 ; 404 ; 405 ; 406 → 407(gate)
E4: 501..504 (later)
```

Critical-path note: **102/103 block all E1 math**; **201 before 203**; **301 before E2
reminders**; **401 before 402/403 and all of E4 B2B**.

---

# Sprint Plan (2-week sprints, ~40 SP velocity)

| Sprint | Tickets | SP | Theme | Deployable outcome |
|---|---|---|---|---|
| S1 | 101, 102, 103, 104, 110 | 19 | Safety base | Hardened env + tests + safe uploads |
| S2 | 105, 106, 107, 108 | 21 | Visibility + scoping | Authz proofs + Sentry + analytics + CSP(report) |
| S3 | 111, 112, 114 | 21 | Media safety + accounts | Moderation + email-verify + soft-delete |
| S4 | 113, 201, 202 | 16 | Clinical base | i18n + corrected age + WHZ |
| S5 | 203, 204 | 13 | KPSP core | Scorer + API (behind flag) |
| S6 | 205, 206 | 16 | KPSP + immun | KPSP UI live + immunization engine |
| S7 | 207, 208 | 11 | Report + gate | Clinician report + clinical sign-off (v1.2 ships) |
| S8 | 301, 302 | 16 | Daily logging base | Queue + feed logging |
| S9 | 303, 304, 305 | 13 | Sleep/diaper + insight | Care logging complete + nap insight |
| S10 | 306 | 13 | Nutrition | MPASI (read-only→planner) |
| S11 | 307, 308 | 13 | Engagement | Digest/insights + celebration (v1.5 ships) |
| S12 | 401 | 13 | Membership refactor | Phase-1 read-through (behavior-identical) |
| S13 | 402 | 13 | Invites | Co-caregiver invites + roles |
| S14 | 403 | 13 | Monetization | Tiers + family + working discounts |
| S15 | 404, 406, 407 | 19 | Keepsake + bridge + gate | Buku Emas + Buku KIA export (v2.0 ships) |
| S16 | 405 | 13 | Offline | Offline-first sync |

> Sprints under 40 SP intentionally hold buffer for the **High-risk** tickets (111, 301, 401,
> 403, 405) and for clinical-review turnaround on E1/E2.

---

# Backlog Health Rules

- No ticket enters a sprint without: acceptance criteria, test plan, and (for medical/authz/
  payment tickets) a named reviewer.
- **High-risk tickets** (Risk: High) require a written rollback step in the PR description and
  a feature flag where applicable.
- Every migration ticket states its number explicitly and is applied to a Neon **preview
  branch** before merge (per the established workflow: user pushes & migrates prod).
- Definition of Done is the global DoD above plus the per-card DoD-delta.
```
