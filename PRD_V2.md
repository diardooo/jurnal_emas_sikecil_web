# PRD v2 — Jurnal Emas Si Kecil

**Status:** Draft for build • **Owner:** Product/Eng • **Last updated:** 2026-06-30
**Source of truth.** This document supersedes ad-hoc planning. It is grounded in the
existing codebase (Next.js 16 App Router, Drizzle/Postgres on Neon, Better Auth,
Zustand, Midtrans, Cloudinary, Gemini). Where a spec references existing code it uses
the real names: the `resource()` / `adminResource()` factories (`src/lib/api.ts`,
`src/lib/admin.ts`), `ACCESS_POLICY` (`src/lib/gating.ts`), `getUserPlan`/`isPremium`
(`src/lib/plan.ts`), `classifyWho`/`whoZScore` (`src/lib/who.ts`), `evaluateRedFlags`
(`src/lib/red-flags.ts`), and the Drizzle migration sequence under `drizzle/` (next free
number is **0013**).

---

## 0. How to read this document

- **Part A — Foundations & conventions** (read once): tech baseline, cross-cutting NFRs,
  the template every feature follows, analytics/event taxonomy, security & privacy
  baseline, testing baseline.
- **Part B — Features**, grouped by release train (v1.1 → v3.0). Each feature is fully
  specified against the template in §A.4.
- **Part C — Dependency graph, milestone plan, release gates.**
- **Part D — Per-feature risk & rollback register.**

Conventions:
- **MUST / SHOULD / MAY** per RFC 2119.
- "Gate" = the existing CI gate: `tsc --noEmit` + `npm run lint` + `npm run build`, all
  clean. v1.1 adds `npm test` to the gate (see F0.1).
- All new tables follow the existing column helpers: `id` = `text` UUID
  (`crypto.randomUUID()`), `userId` = `text` FK → `user.id` `onDelete: cascade`,
  `createdAt` = `timestamp.defaultNow()`. Child-scoped tables add `childId` FK →
  `children.id` `onDelete: cascade`.
- All user-owned endpoints MUST go through `resource()` or replicate its three guarantees:
  (1) `getUser` 401 gate, (2) every query filtered by `userId`, (3) `childId` writes
  validated by `ownsChild`. Admin endpoints MUST go through `adminResource()` / `getAdmin`.

---

# PART A — FOUNDATIONS & CONVENTIONS

## A.1 Product North Star

**Vision:** The trusted golden record of an Indonesian child's first 2,000 days —
clinically credible, emotionally precious, used daily by the whole family.

**Strategy pillars (drive every prioritization call):**
1. **Trust** — clinical correctness (WHO/IDAI/KPSP) verifiable and tested.
2. **Habit** — a daily loop worth opening (care logging + ritual + memory).
3. **Family** — more than one caregiver per child.
4. **Local moat** — KPSP, Posyandu, Buku KIA, MPASI/stunting.

**Primary KPI tree:**
- North Star: **Weekly Active Families (WAF)** — a family with ≥1 caregiver logging ≥1
  meaningful event in a 7-day window.
- Inputs: Activation (onboarding→first-week retention), D7/D30 retention, caregivers per
  child, premium conversion, clinical-report shares.

## A.2 Tech baseline (frozen for v1.x)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TS strict | no change |
| DB | Postgres (Neon), Drizzle ORM | new tables via numbered migrations |
| Auth | Better Auth (email+password, Google OAuth) | email verification turned **on** in v1.1 |
| State | Zustand single store + optimistic persist | new slices append, never rewrite hydrate contract |
| AI | Gemini 2.5 Flash via `src/lib/ai/provider.ts` | provider swappable; key server-only |
| Payments | Midtrans Snap | tiering + discounts wired in v2.0 |
| Media | Cloudinary (signed upload) | moderation added in v1.1 |
| Jobs | Vercel Cron (today) → durable queue (v1.5) | see F-INFRA-2 |
| Observability | Vercel Analytics + Speed Insights → **+ Sentry (v1.1)** | F0.4 |

## A.3 Cross-cutting Non-Functional Requirements (apply to ALL features)

- **Performance:** p75 API latency < 400 ms (excluding LLM/Cloudinary upstreams); LCP <
  2.5 s on mid-tier Android over 4G; any new initial-hydrate payload MUST be paginated or
  lazy (no unbounded `select *`). LLM endpoints stream or show progress within 1 s.
- **Availability:** 99.9% monthly for core read/write paths. Third-party outage (Gemini,
  Midtrans, Cloudinary) MUST degrade gracefully (503 + user-readable Indonesian copy),
  never 500-crash the page. This pattern already exists (`aiConfigured()`,
  `midtransConfigured()`, `cloudinaryConfigured()`) — extend it.
- **Security:** every endpoint authenticated+authorized by default; deny-by-default;
  input whitelisting via the factory `sanitize()`; no secret reaches the client; signed
  webhooks; rate-limited auth. New: CSP (F0.5), upload moderation (F0.3).
- **Privacy (UU PDP / GDPR-aligned):** data minimization, purpose limitation, export
  (`/api/me/export` exists), erasure (Better Auth `deleteUser` cascade exists), explicit
  consent for any new processing class (e.g. AI on photos). Children's data is **sensitive
  personal data** under UU PDP — treat accordingly.
- **Accessibility:** WCAG 2.1 AA target. Every interactive element keyboard-reachable and
  labeled; color never the sole signal (red-flag cards already pair color with text/icon);
  contrast ≥ 4.5:1; respects `prefers-reduced-motion`; dialogs trap focus (Radix already
  does). Indonesian screen-reader labels.
- **i18n readiness:** all new user-facing strings go through a string layer (introduced in
  F0.6) — no new hardcoded Indonesian in components after v1.1.
- **Testing:** see A.6.
- **Backward compatibility:** additive migrations only (new nullable columns / new tables);
  existing hydrate paths keep their defensive `.catch(()=>[])`; no breaking API shape
  changes without a versioned route.

## A.4 The Feature Spec Template

Every feature in Part B is specified with exactly these headings:

1. Problem Statement 2. Business Goal 3. User Goal 4. Success Metrics 5. Scientific Basis
6. Target Users 7. User Stories 8. Acceptance Criteria 9. Functional Requirements
10. Non-functional Requirements 11. UI Requirements 12. Accessibility 13. Edge Cases
14. Validation Rules 15. Permissions 16. Database Changes 17. API Endpoints
18. State Management 19. Error Handling 20. Loading States 21. Empty States
22. Notifications 23. Analytics Events 24. Security 25. Privacy 26. Performance
27. Testing 28. Migration Strategy 29. Backward Compatibility 30. Future Expansion
31. Risks & Rollback (also aggregated in Part D).

To keep this readable, foundational P0 features (v1.1) are specified at full ceremony;
later features reuse the template but compress sections that simply inherit the baseline
(marked "inherits A.3").

## A.5 Analytics & Event Taxonomy (global)

- Transport: a thin `track(event, props)` wrapper (added F0.4) → Vercel/PostHog-compatible.
- Naming: `domain.object_action` snake-ish, e.g. `growth.measurement_added`,
  `kpsp.screening_completed`, `coach.question_asked`, `billing.checkout_started`.
- Every event MUST carry: `userId` (hashed), `plan`, `childAgeMonths` (bucketed), `surface`.
- No PII or child name in event props. No free-text journal/coach content in analytics.
- A canonical event registry lives in `src/lib/analytics/events.ts` (F0.4); adding an event
  without registering it fails lint (custom rule, best-effort).

## A.6 Testing Baseline (introduced F0.1, mandatory thereafter)

- **Unit (Vitest):** all pure logic — `who.ts`, `red-flags.ts`, `coach-context.ts`,
  `payment-apply.ts`, `midtrans.verifySignature`, KPSP scoring, age/corrected-age,
  nutrition classifiers. Target: 100% of pure "math/safety" modules, ≥80% lines overall on
  `src/lib`.
- **Integration (Vitest + test Postgres / pglite):** factory CRUD ownership scoping
  (prove cross-user access returns 404/403), payment outcome idempotency, admin gating.
- **E2E (Playwright):** auth, onboarding→first measurement, premium gate, share-report,
  KPSP run. Run on CI for `main` + PRs.
- **Contract tests:** Midtrans webhook signature; Gemini provider error→status mapping.
- Gate update: CI adds `npm test` (unit+integration) blocking; E2E nightly + pre-release.

## A.7 Security & Privacy Baseline deltas (the non-negotiable P0s)

These are specified as features F0.x because they are prerequisites for scale and appear
in the dependency graph as blockers for monetization and media features.

---

# PART B — FEATURES

## RELEASE TRAIN v1.1 — "Trustworthy & Safe" (P0 foundations)

> Objective: zero P0 risks open; safe to scale and to take money. Every item below is
> independently deployable.

### F0.1 — Automated Test Harness on Safety-Critical Logic

1. **Problem.** No automated tests exist. The WHO z-score, red-flag, and payment modules
   are pure and safety/revenue-critical; a regression silently mislabels a healthy child as
   stunted or mis-settles a payment.
2. **Business Goal.** Protect clinical trust and revenue integrity; enable fast, safe
   iteration by 20 engineers in parallel.
3. **User Goal.** (Indirect) Correct verdicts and billing they can trust.
4. **Success Metrics.** ≥80% line coverage on `src/lib`; 100% on math/safety modules;
   0 P0 regressions reaching prod post-adoption; CI test stage < 3 min.
5. **Scientific Basis.** Test vectors derived from official WHO LMS tables (the same source
   `who-lms.ts` was generated from) and CDC "Learn the Signs" reference ages — verified
   against published percentile examples.
6. **Target Users.** Engineering, QA.
7. **User Stories.** As an engineer, I can change `who.ts` and know within minutes if a
   z-score boundary broke. As QA, I can see coverage on every PR.
8. **Acceptance Criteria.** Vitest configured; ≥30 golden test vectors for z-scores
   (boundaries z=−3,−2,0,+2,+3 and tail extrapolation) for both sexes; red-flag tests for
   regression-at-any-age + overdue-by-window; payment idempotency tests (duplicate
   settlement does not stack days; failed renewal does not downgrade valid premium);
   signature verify pass/fail. CI fails on any failing test or coverage drop below
   threshold.
9. **Functional Requirements.** Add Vitest + coverage; `npm test` script; integration tests
   spin an ephemeral Postgres (pglite or testcontainers) and exercise the `resource()`
   factory proving `userId` scoping (user B cannot read/patch/delete user A's row → 404).
10. **NFR.** Tests deterministic, no network; < 3 min wall.
11. **UI.** None.
12. **Accessibility.** N/A.
13. **Edge Cases.** Age exactly 0 and exactly 60 months; value ≤ 0 (returns null); leap-year
   age math; timezone in `getAge`.
14. **Validation.** N/A (validates code).
15. **Permissions.** N/A.
16. **DB.** None (test DB only).
17. **API.** None.
18. **State.** None.
19–22. **Error/Loading/Empty/Notif.** N/A.
23. **Analytics.** CI coverage reported to dashboard (non-product).
24. **Security.** Test DB never uses prod creds; CI secrets are dummy (already the pattern).
25. **Privacy.** No real user data in fixtures.
26. **Performance.** As NFR.
27. **Testing.** This *is* the testing feature; meta-tested by CI going red on a seeded bug.
28. **Migration.** None.
29. **Backward compat.** Pure addition.
30. **Future.** Mutation testing; visual regression (Playwright + snapshots) in v1.5.
31. **Risk/Rollback.** Low risk. Rollback = remove `npm test` from gate (tests stay).

### F0.2 — Production Auth-Secret & Config Hardening

1. **Problem.** `src/lib/auth.ts` falls back to `secret: "dev-secret-change-me"` and
   `baseURL: localhost` when env is unset. If a prod deploy is misconfigured, sessions
   become forgeable with a publicly known secret.
2. **Business Goal.** Eliminate catastrophic account-takeover class.
3–4. **Metrics.** 0 boots in `production` with default secret (assertion enforced); alert
   on misconfig.
5. **Scientific Basis.** N/A (security).
6. **Target Users.** All.
7. **Stories.** As an operator, a misconfigured prod deploy fails fast and loudly instead of
   silently insecure.
8. **Acceptance Criteria.** When `NODE_ENV==="production"`: missing `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL`, or `DATABASE_URL` → process throws on boot (build/start fails), logged
   clearly. Dev/demo unchanged. Secret length ≥ 32 enforced.
9. **Functional.** Central `assertProdEnv()` invoked from server bootstrap; covers auth
   secret, base URL (https), DB URL, and—when their features are "on"—VAPID/Cron/Midtrans
   keys.
10. **NFR.** Adds < 5 ms to cold start.
15. **Permissions.** N/A.
16. **DB.** None.
24. **Security.** Core of the feature. Also rotate the current prod secret as part of rollout.
28. **Migration.** None; ops runbook updated in `DEPLOYMENT.md`.
31. **Risk/Rollback.** Risk: a real prod missing an env now hard-fails (intended). Rollback =
   downgrade missing-env to warn (not recommended). Mitigation: verify Vercel envs before merge.

### F0.3 — Upload Pipeline Hardening + Content Moderation

1. **Problem.** `/api/upload` accepts a **client-controlled `folder`**, performs no content
   moderation, and there is no per-user rate/size budget. The platform stores **children's
   photos** — at scale, absence of CSAM/NSFW screening is a legal and safety failure.
2. **Business Goal.** Make user media safe and abuse-resistant before media features grow.
3. **User Goal.** Trust that photos are private, safe, and won't be misused.
4. **Metrics.** 100% uploads server-foldered; 100% screened; abusive-upload rate ~0;
   moderation false-positive appeal path < 24 h.
5. **Scientific Basis.** N/A.
6. **Target Users.** All who upload (profile/child/journal/milestone photos).
7. **Stories.** As a parent, my child's photo goes only into my private space. As the
   platform, illegal content is blocked and reported per legal obligation.
8. **Acceptance Criteria.** `folder` derived server-side as `jurnal-emas/{user.id}/{purpose}`
   (client value ignored). Cloudinary moderation (e.g. `moderation: aws_rek`/manual) enabled;
   rejected assets never surface a URL and return 422 with calm copy. Per-user quota: ≤ N
   uploads/min and ≤ M MB/day (config). MIME + magic-byte check (not just `file.type`).
9. **Functional.** Extend `uploadImage` to set moderation + server folder; add a moderation
   webhook handler to delete/flag rejected assets; quota counter (reuse a daily-counter
   table pattern like `coachUsage`).
13. **Edge Cases.** Moderation pending (async) → optimistic "processing" state, hide until
   approved; HEIC/iOS formats; very large dimensions; animated images.
14. **Validation.** size ≤ 5 MB (exists), MIME image/*, magic bytes, dimension cap.
15. **Permissions.** Premium gate for journal/milestone stays (`PREMIUM_PURPOSES`).
16. **DB.** `upload_usage` (user/date/count/bytes) — migration 0013. Optional `media_assets`
   table to track moderation status (id, userId, publicId, status, purpose).
17. **API.** `POST /api/upload` (hardened); `POST /api/upload/moderation-callback` (signed).
24. **Security.** Signed Cloudinary uploads (exists); verify moderation callback signature;
   strip EXIF GPS on upload.
25. **Privacy.** EXIF GPS removal is required (photos of children must not leak home
   location). Document in `/privacy`.
28. **Migration.** 0013 additive.
31. **Risk/Rollback.** Risk: moderation false positives block legit baby photos. Mitigation:
   manual-review queue + appeal. Rollback: disable auto-reject, keep server-folder + EXIF
   strip (these have no downside).

### F0.4 — Observability & Product Analytics

1. **Problem.** Errors in production are invisible (console-only); no product funnels.
2. **Business Goal.** See and fix failures; measure activation/retention/conversion.
3–4. **Metrics.** MTTD < 5 min on error spikes; funnel dashboards for onboarding, KPSP,
   billing.
6. **Target Users.** Eng, Product.
8. **Acceptance Criteria.** Sentry capturing server + client errors with release tagging and
   PII scrubbing; `track()` wrapper + event registry (§A.5) wired to first 15 core events;
   no journal/coach text ever sent.
9. **Functional.** `src/lib/analytics/{track,events}.ts`; Sentry init in root layout + route
   handlers; sample rates configurable.
24/25. **Security/Privacy.** Scrub PII, hash userId, deny-list free-text fields; cookie
   consent banner gates analytics where required.
31. **Risk/Rollback.** Low. Rollback = flip sampling to 0.

### F0.5 — Content Security Policy & Header Completion

1. **Problem.** CSP intentionally omitted (`next.config.mjs`); journal/coach render
   user-generated text → XSS surface.
2. **Business Goal.** Close the main client-side injection class.
8. **Acceptance Criteria.** Report-only CSP shipped first (allow-listing Cloudinary, Google
   OAuth, Gemini calls are server-side so not needed in browser, Vercel, inline-style nonce);
   after 1–2 weeks of clean reports, enforce. No functional regressions to images/auth.
9. **Functional.** Add CSP to `securityHeaders`; nonce strategy for any inline styles/scripts;
   sanitize/escape all user text render paths (verify journal/notes never use
   `dangerouslySetInnerHTML`).
31. **Risk/Rollback.** Risk: over-strict CSP breaks an integration. Mitigation: report-only
   phase. Rollback: revert to report-only or remove header.

### F0.6 — String/i18n Layer + Email Verification On

Two small but foundational changes bundled (independently shippable):
- **Email verification ON** (`requireEmailVerification: true`) once Resend is active
  (`RESEND_API_KEY`). Blocks fake-email account creation; gate sensitive actions behind a
  verified email. Acceptance: new signups receive a verification email; unverified accounts
  can browse but cannot create a share link or start checkout until verified. Backward compat:
  existing users grandfathered `emailVerified=true` via one-time backfill migration 0014.
- **String layer:** central `t(key)` (lightweight, ID default) so v1.2+ strings are
  externalized; no behavior change, just refactor of new strings.
- **Risk/Rollback.** Email-verify risk: deliverability friction → mitigate with resend flow +
  grace browse. Rollback: flip flag off.

### F0.7 — Soft-Delete & "Export Before Delete" Safety Net

1. **Problem.** `deleteUser` (and child delete) cascade **irreplaceable** photos/journals
   instantly. For the namesake "golden journal," accidental permanent loss is catastrophic UX.
2. **Business Goal.** Prevent rage-churn and irreversible data loss; build trust.
3. **User Goal.** "I can undo a mistake; I can take my memories with me."
8. **Acceptance Criteria.** Child & account deletion become a **30-day soft-delete**
   (`deletedAt` set, hidden from all queries) with a restore path; account deletion forces an
   export download first (or explicit "skip export" confirm); hard purge runs by scheduled job
   after 30 days. Right-to-erasure still honored (immediate hard-delete option remains,
   clearly labeled, for UU PDP compliance).
16. **DB.** Add nullable `deletedAt timestamp` to `children` and a `userStatus='pending_delete'`;
    a purge job. Migration 0015 additive.
9. **Functional.** All `resource()` reads add `isNull(table.deletedAt)` for tables that gain
   it; a `Trash` surface in Settings; purge cron.
31. **Risk/Rollback.** Risk: soft-deleted data lingers (privacy) → bounded by 30-day purge +
   immediate-erasure option. Rollback: keep export-before-delete, drop soft-delete.

---

## RELEASE TRAIN v1.2 — "Clinically Credible"

> Objective: earn pediatrician/Posyandu trust. Depends on F0.1 (tests) for all math.

### F1.1 — KPSP Screening Module (Kuesioner Pra Skrining Perkembangan)

1. **Problem Statement.** The app ships a CDC-style milestone checklist, not Indonesia's
   official **KPSP** instrument. Indonesian parents, bidan, and Posyandu cadres trust KPSP;
   without validated KPSP scoring the app cannot claim developmental-screening authority in
   its home market.
2. **Business Goal.** Become the credible digital KPSP — the wedge no global competitor and
   no clunky government tool occupies. Drives clinical partnerships and word-of-mouth.
3. **User Goal.** "Tell me, using the standard my bidan uses, whether my child's development
   is on track — and what to do if not."
4. **Success Metrics.** % active children with ≥1 KPSP completed at the correct age window;
   KPSP completion → return-in-7-days lift; share-to-clinician rate from KPSP results;
   qualitative pediatrician trust (NPS).
5. **Scientific Basis.** KPSP per **Kemenkes RI / IDAI SDIDTK**: age-specific questionnaires
   at 3,6,9,12,15,18,21,24,30,36,42,48,54,60,72 months; 9–10 "Ya" = **Sesuai (S)**, 7–8 =
   **Meragukan (M)**, ≤6 = **Penyimpangan (P)**; defined re-screen and referral actions.
   Question bank MUST be transcribed verbatim from the official instrument with citation.
6. **Target Users.** Parents (primary); bidan/cadres (report consumers).
7. **User Stories.**
   - As a parent, when my child reaches a KPSP age window, I'm prompted to run the screening.
   - As a parent, I answer 9–10 simple Ya/Tidak questions and immediately see S/M/P plus
     calm, correct guidance (re-screen in 2 weeks for M; refer for P).
   - As a parent, I can export the KPSP result into the doctor report.
8. **Acceptance Criteria.**
   - The module selects the correct questionnaire by the child's **age in months** (using the
     KPSP banding rule: use the questionnaire for the nearest lower defined age; round up if
     within 16 days of the next, per SDIDTK guidance).
   - Scoring: count "Ya"; classify S/M/P exactly per thresholds; show the official
     interpretation and next action.
   - Result persisted, timestamped, immutable (re-screens create new records).
   - "Penyimpangan" result surfaces a calm, non-alarming referral card (consistent with
     existing red-flag tone) routing to bidan/dokter/Posyandu, explicitly "bukan diagnosis."
   - Works offline-capture (answers buffered, synced) — SHOULD (depends on F-INFRA offline);
     MUST at minimum not lose answers on a flaky connection.
9. **Functional Requirements.**
   - Question bank as **versioned reference content** (admin-managed, like `ref_milestones`):
     `ref_kpsp_questions` keyed by `ageMonths` + `order` + `domain` + `text` + `version`.
   - Deterministic scorer `scoreKpsp(answers): { yaCount, result: "S"|"M"|"P" }` — **pure,
     unit-tested** (F0.1).
   - Age-window selector `selectKpspForm(ageMonths)`.
   - Re-screen scheduling: "M" result schedules a +14-day reminder (via notifications engine).
10. **NFR.** Inherits A.3. Scoring < 5 ms; questionnaire loads < 300 ms.
11. **UI.** Stepper, one question per screen on mobile (or a compact list on desktop); large
   Ya/Tidak targets; progress; result screen with color+icon+text (never color-only); clear
   "what next." Entry points: dashboard prompt card when due, and a tab in the development
   section.
12. **Accessibility.** Each question a labeled radio group; keyboard + screen-reader flow;
   result conveyed in text.
13. **Edge Cases.** Child age < 3 mo or > 72 mo (out of KPSP range → explain, offer milestone
   tracking instead); premature child → use **corrected age** (depends F1.3); partially
   completed screening (resume/discard); multiple screenings same day.
14. **Validation.** Every question answered before scoring; answers ∈ {ya,tidak}; age in range.
15. **Permissions.** Free feature (screening must not be paywalled — trust + ethics). Photo
   attachments to a result are Premium (reuse upload gate). Owner + invited caregivers
   (F2.1) can run/view.
16. **Database Changes (migration 0016, additive).**
   - `ref_kpsp_questions` (admin/global): `id, ageMonths, order, domain, text, version,
     active, createdAt`.
   - `kpsp_screenings` (user/child-owned): `id, userId, childId, ageMonthsAtScreening,
     formAgeMonths, yaCount, result ('S'|'M'|'P'), answers jsonb, correctedAgeUsed boolean,
     createdAt`.
17. **API Endpoints.**
   - `GET /api/kpsp/form?childId=` → the due/closest questionnaire + whether one is due.
   - `POST /api/kpsp/screenings` (body: childId, answers) → scores server-side, persists,
     returns result. (Scoring server-side so the verdict can't be spoofed.)
   - `GET /api/kpsp/screenings?childId=` → history.
   - Admin: `adminResource(ref_kpsp_questions)` CRUD under `/api/admin/content/kpsp`.
18. **State Management.** New Zustand slice `kpsp`: due-status per child, screening history;
   optimistic add; hydrate appends to existing parallel fetch (defensive `.catch`).
19. **Error Handling.** Out-of-range age → friendly explainer (not error). Save failure →
   keep answers locally, retry; never lose input.
20. **Loading States.** Skeleton on form fetch; spinner on submit.
21. **Empty States.** "Belum ada skrining KPSP. Skrining berikutnya saat usia X bulan."
22. **Notifications.** "KPSP usia X bulan sudah waktunya" when due; "+14 hari re-skrining"
   after an "M" result.
23. **Analytics.** `kpsp.prompt_shown`, `kpsp.started`, `kpsp.completed{result}`,
   `kpsp.referral_card_shown`, `kpsp.shared_to_report`.
24. **Security.** Server-side scoring; child ownership enforced; reference content admin-gated.
25. **Privacy.** Screening results are sensitive health data; included in export & erasure;
   never in analytics props.
26. **Performance.** Inherits A.3.
27. **Testing.** Golden tests: every age band's threshold boundaries (yaCount 6/7/8/9);
   age-window selection rule; corrected-age path; E2E run-through.
28. **Migration Strategy.** Seed `ref_kpsp_questions` from official source via a seed script
   (`scripts/seed-kpsp.ts`) with version "kemenkes-sdidtk-2016" (or latest). Idempotent.
29. **Backward Compatibility.** Purely additive; existing milestone tracking untouched and
   coexists (KPSP is the validated screen; milestones remain the longitudinal tracker).
30. **Future Expansion.** KPSP companion tools (TDD/TDL hearing-vision, KMME/M-CHAT autism,
   GPPH) as additional validated instruments; cadre-facing batch screening (v3.0 B2B).
31. **Risk/Rollback.** **Scientific risk: HIGH** — wrong questions/thresholds = wrong verdict
   on a child's development. Mitigation: verbatim transcription + clinical review sign-off +
   exhaustive scorer tests + versioned content + explicit "bukan diagnosis." Rollback:
   feature-flag KPSP off (keeps milestone tracker as fallback); content version pin.

### F1.2 — Complete WHO Indicator Set (Weight-for-Height / BMI-for-age)

1. **Problem.** Only weight-for-age (WAZ), height-for-age (HAZ), head-circ are classified.
   **Wasting (weight-for-length/height)** and **BMI-for-age** are missing — core WHO
   indicators and central to Indonesia's stunting/wasting programs. Without them growth
   monitoring is clinically incomplete.
2. **Business Goal.** Complete, program-aligned growth monitoring → clinical credibility.
4. **Metrics.** % children with a computed wasting status; clinician report completeness.
5. **Scientific Basis.** WHO Child Growth Standards: **weight-for-length** (0–24 mo, length)
   and **weight-for-height** (24–60 mo, height), and **BMI-for-age**; LMS method identical to
   existing `whoZScore`. Classification: WHZ < −3 severe wasting, < −2 wasting, > +2
   overweight, > +3 obese.
8. **Acceptance Criteria.** New LMS tables (WFL/WFH by sex) added to `who-lms.ts` generator
   output; `classifyWho` extended to a `"wasting"`/`"bmi"` metric computing WHZ from the
   nearest length/height; growth UI shows wasting status + chart; out-of-range handled
   (>60 mo fallback). All boundaries unit-tested.
9. **Functional.** `whoZScore("wfl"|"wfh", sex, lengthOrHeightCm, weightKg)` — note this
   indicator is indexed by length/height, not age, so the interpolation key changes; design
   a parallel `lmsAtByLength()`. Keep age-indexed path untouched (backward compatible).
16. **DB.** None required (growth_records already stores weight+height); optionally cache
   computed WHZ. If cached, additive nullable columns on `growth_records` (migration 0017).
17. **API.** None new; classification is computed in `lib/who.ts` and surfaced via existing
   growth read path / coach context.
23. **Analytics.** `growth.wasting_status_computed{band}`.
27. **Testing.** Golden WHZ vectors from WHO tables; length-indexed interpolation tests.
28. **Migration.** Data tables are code (`who-lms.ts`), regenerated by the existing generator;
   document the source.
31. **Risk/Rollback.** Scientific risk HIGH (same class as F-WHO). Mitigation: tests + source
   citation. Rollback: hide wasting UI (keep computation behind flag).

### F1.3 — Corrected Age for Premature Infants

1. **Problem.** Growth z-scores and milestone/KPSP "overdue" logic use chronological age
   from `dob` only. For preterm infants this produces **false stunting/delay flags**.
2. **Business Goal.** Avoid alarming parents of preemies and avoid clinician distrust.
5. **Scientific Basis.** Standard pediatric practice: correct for prematurity until 24 months
   using gestational age (corrected age = chronological − (40 − gestationalWeeks) weeks).
8. **Acceptance Criteria.** Optional gestational age at birth (weeks) on child profile; when
   present and child < 24 mo, growth classification, milestone windows, KPSP form selection,
   and red-flags use **corrected age**, with a visible "usia koreksi" badge explaining it;
   ≥ 24 mo reverts to chronological automatically.
16. **DB.** `children.gestationalWeeks integer null` (migration 0018, additive).
9. **Functional.** `getCorrectedAge(dob, gestationalWeeks)` pure util; all age consumers take
   an effective-age input. Default (null) = chronological (full backward compat).
13. **Edge Cases.** Term (≥37 wk) → no correction; extreme prematurity; crossing 24 mo.
27. **Testing.** Unit tests for correction math + cutoff at 24 mo.
31. **Risk/Rollback.** Scientific risk MED. Mitigation: tests + clinician review of cutoff
   rule. Rollback: ignore the column (treat as null).

### F1.4 — IDAI Immunization Engine + Due/Overdue Reminders

1. **Problem.** Immunizations exist as records but there's no engine driving the **current
   IDAI schedule**, catch-up logic, or proactive due reminders — the highest-frequency
   "useful nudge" in the 0–18 mo window.
2. **Business Goal.** Recurring, high-value engagement; positions app as the vaccine source
   of truth.
5. **Scientific Basis.** **IDAI immunization schedule (latest, e.g. 2023/2024 jadwal)**;
   catch-up rules per IDAI. Content versioned + admin-managed (`ref_immunizations` exists).
8. **Acceptance Criteria.** On child creation, seed the full IDAI schedule with due dates
   computed from DOB; dashboard shows next due + overdue; reminders fire ahead of due date;
   marking done updates status; catch-up suggestions for missed doses; schedule content
   updatable by admin without code deploy.
16. **DB.** `ref_immunizations` (exists) gains `version`; per-child rows (exist). Migration
   0019 additive if version added.
17. **API.** Existing immunization CRUD; add `GET /api/immunizations/due?childId=`.
22. **Notifications.** "Imunisasi X jatuh tempo dalam 7 hari / hari ini / terlewat."
23. **Analytics.** `immunization.due_shown`, `immunization.marked_done`, `..._overdue`.
27. **Testing.** Schedule computation per DOB; catch-up logic.
31. **Risk/Rollback.** Scientific risk MED-HIGH (wrong schedule → missed vaccine). Mitigation:
   verbatim IDAI source + version + clinician review. Rollback: pin previous version.

### F1.5 — Clinician-Grade Report & Hardened Share

1. **Problem.** A share link exists but the artifact isn't a clinical-grade report a doctor
   respects; and public-token exposure should be tightened.
2. **Business Goal.** "Bring this to your pediatrician" → trust + organic clinician exposure.
5. **Scientific Basis.** Presents WHO curves with the child's plotted points (WAZ/HAZ/HCZ +
   new WHZ), milestone/KPSP status, immunization status, red flags — all already computed.
8. **Acceptance Criteria.** Generate a print/PDF report (server-rendered) with growth charts,
   latest z-scores/percentiles, KPSP latest result, immunization completeness, and red-flag
   summary; public share remains token + expiry (exists) but adds optional PIN and one-tap
   revoke; report shows "dibuat oleh orang tua, bukan dokumen medis resmi" disclaimer.
16. **DB.** `report_shares` (exists) gains optional `pinHash`, `revokedAt` (migration 0020).
17. **API.** Existing `/api/reports/share` + `/api/public/report/[token]` (extend with PIN
   check + revoke endpoint `DELETE /api/reports/share/[id]`).
15. **Permissions.** Creating share = Premium (exists); viewing = public token (+PIN).
24/25. **Security/Privacy.** Token is unguessable UUID (exists); add PIN; minimal data
   (exists); rev{ocation}; expiry (exists). No contact info exposed.
31. **Risk/Rollback.** Risk: PDF rendering cost/lib weight. Mitigation: server route +
   caching; or print-CSS fallback. Rollback: keep HTML report, drop PDF.

---

## RELEASE TRAIN v1.5 — "Daily Companion" (habit & retention)

> Objective: a loop worth opening daily. Depends on v1.1 infra; F2.x sleep/feed depend on a
> durable job queue (F-INFRA-2) for predictions/reminders at scale.

### F-INFRA-2 — Durable Job/Reminder Queue

1. **Problem.** `morning-digest` is a sequential per-user loop in one cron invocation — fine
   today, fails at scale; and several v1.2+ features need scheduled per-user reminders
   (KPSP re-screen, immunization due, sleep windows).
2. **Business Goal.** Reliable notifications = retention engine that scales.
8. **Acceptance Criteria.** A queue (e.g. Vercel Queues / QStash / a `scheduled_jobs` table +
   worker) that enqueues per-user reminder jobs and processes them idempotently with retries;
   the morning digest becomes a fan-out enqueue, not an inline loop; dead-subscription pruning
   preserved.
16. **DB.** `scheduled_jobs` (id, userId, type, runAt, payload jsonb, status, attempts).
   Migration 0021.
31. **Risk/Rollback.** Risk: duplicate/missed notifications. Mitigation: idempotency keys +
   at-least-once with dedupe. Rollback: revert to inline cron for digest.

### F2.0 — Daily Care Logging (Feed / Sleep / Diaper)

1. **Problem Statement.** The app tracks development well but barely supports the **0–18 mo
   daily-care logging** (feeding, sleep, diaper) that drives daily habit in Huckleberry/Nara.
   This is the missing retention workhorse.
2. **Business Goal.** Convert development-tracker users into daily-active users; expand TAM to
   newborn parents.
3. **User Goal.** "Quickly log feeds/sleep/diapers one-handed at 3 a.m. and see patterns."
4. **Success Metrics.** Logs/active-day; D7/D30 retention lift; % 0–18 mo accounts logging
   daily.
5. **Scientific Basis.** WHO/IDAI feeding guidance (exclusive breastfeeding 0–6 mo), normal
   sleep ranges by age (you already hold `ref_sleep` guidance); no diagnosis — pattern
   surfacing only.
6. **Target Users.** Parents of 0–18 mo (extends to toddlers for sleep).
7. **User Stories.** Log breastfeed (side, duration), bottle (ml), MPASI; log sleep
   start/end or quick nap; log diaper (pee/poo, notes); see today's summary and weekly trend.
8. **Acceptance Criteria.** One-tap quick-log from dashboard + a running timer for
   bre/sleep; entries editable/deletable; per-child; daily + weekly summaries; all offline-
   capable (buffer + sync); contributes to coach context.
9. **Functional.** Timer state survives reload; quick-add reuses the existing `QuickAdd`
   pattern; summaries computed client-side from the day's rows.
16. **DB.** `feed_logs` (id,user,child,type['breast'|'bottle'|'solid'],side,durationMin,
   amountMl,note,at,createdAt); `diaper_logs` (id,user,child,kind['pee'|'poo'|'mixed'],
   note,at); `sleep_logs` (exists — extend with start/end timestamps + `kind['nap'|'night']`,
   keep legacy `nightHours/napHours` for backward compat). Migrations 0022–0023.
17. **API.** `resource()` factories for `feed_logs`, `diaper_logs`; extend sleep route.
18. **State.** New slices `feed`, `diaper`, `sleep` (optimistic); paginate by date range
   (do NOT load all history into the global hydrate — query by visible window).
20/21. **Loading/Empty.** Skeletons; "Belum ada catatan hari ini — mulai dengan tombol +".
22. **Notifications.** Optional feed/sleep reminders (config), via F-INFRA-2.
23. **Analytics.** `care.feed_logged{type}`, `care.sleep_logged`, `care.diaper_logged`.
26. **Performance.** Windowed queries; indexes on (childId, at). This is the first feature
   that MUST NOT join the unbounded global hydrate.
27. **Testing.** Summary aggregation; timezone day boundaries; timer persistence.
28. **Migration.** Additive; sleep extension keeps old columns populated (derive hours from
   start/end when present).
29. **Backward compat.** Existing `sleep_logs` rows (hours-only) still render.
30. **Future.** Pattern insights, sleep prediction (F2.1), pediatric feeding flags.
31. **Risk/Rollback.** UX risk: logging friction kills adoption → obsess over 1-tap + timers.
   Perf risk: data volume → windowed queries + indexes. Rollback: feature-flag per log type.

### F2.1 — Sleep Insight & Nap-Window Suggestion

1. **Problem.** Parents desperately want "when should baby nap next?" (Huckleberry's moat).
2. **Business Goal.** Signature premium-worthy feature; daily reason to return.
5. **Scientific Basis.** Age-based wake-windows + total sleep ranges (IDAI/AAP/WHO ranges
   you already encode in `ref_sleep`); **suggestion, not medical advice** — clearly framed.
8. **Acceptance Criteria.** From logged sleep (F2.0) + age, suggest the next optimal sleep
   window as a range with confidence and a calm disclaimer; improves as more data is logged;
   no suggestion until minimum data exists (cold-start handled with age-based defaults).
9. **Functional.** Deterministic heuristic first (wake-window by age); ML/personalization
   later. Pure `suggestNapWindow(ageMonths, recentSleep)` — unit-tested.
15. **Permissions.** Free basic (age-based) + Premium personalized (anxiety-reduction hook).
31. **Risk/Rollback.** Scientific/UX risk: wrong suggestion erodes trust → present as range +
   "setiap anak berbeda," never a command. Rollback: show static age-based guidance only.

### F2.2 — MPASI Planner & Nutrition (Stunting Prevention)

1. **Problem.** No nutrition/MPASI support despite stunting being Indonesia's #1 child-health
   priority and a key parent anxiety.
2. **Business Goal.** Unique local moat; grant/government relevance; premium content.
5. **Scientific Basis.** WHO/Kemenkes MPASI guidance: introduction at 6 mo, texture/portion
   progression, protein/iron focus, allergen introduction, "Isi Piringku." Content versioned
   + clinician-reviewed.
8. **Acceptance Criteria.** Age-appropriate MPASI schedule from 6 mo; local-ingredient recipes
   by age/texture; portion guidance; allergen-introduction tracker; ties to growth (low WAZ/WHZ
   surfaces gentle nutrition guidance + "consult"). All non-prescriptive.
16. **DB.** `ref_recipes`, `ref_mpasi_stages` (admin/global, versioned); `allergen_log`
   (user/child). Migrations 0024+.
15. **Permissions.** Basics free; full recipe library + planner Premium.
31. **Risk/Rollback.** Scientific risk HIGH (allergens/choking). Mitigation: clinician review,
   prominent safety notes (choking hazards, allergen guidance), no medical claims. Rollback:
   ship read-only guidance before interactive planner.

### F2.3 — Weekly Digest & Proactive AI Insights

1. **Problem.** Engagement loop is thin; AI coach is reactive only.
2. **Business Goal.** Retention via a weekly "kabar tumbuh kembang" + proactive nudges.
8. **Acceptance Criteria.** Weekly email/push summarizing the child's week (new milestones,
   growth points, KPSP due, immunization due, journal highlights) generated server-side;
   proactive insight cards on dashboard ("DPT-3 terlewat," "BB belum diukur bulan ini").
   Grounded in real data (reuse `buildCoachContext`); opt-out respected.
9. **Functional.** Insight rules engine (deterministic) + optional LLM summary; via F-INFRA-2.
31. **Risk/Rollback.** Risk: notification fatigue → frequency caps + preferences. Rollback:
   disable proactive, keep manual coach.

### F2.4 — Memory Resurfacing & Shareable Celebration Moments

1. **Problem.** The namesake "golden journal" under-delivers emotionally; no celebration or
   shareable moments (organic-growth lever).
2. **Business Goal.** Emotional moat + viral acquisition via beautiful shareable cards.
5. **Scientific Basis.** Habit/behavioral design (variable reward, peak-end); not clinical.
8. **Acceptance Criteria.** "Setahun lalu" memory cards (you already have `resurfaceMemory`);
   milestone-achieved celebration animation + shareable image card (no child PII unless parent
   opts in); respects `prefers-reduced-motion`.
24/25. **Security/Privacy.** Shareable images generated server-side; default excludes full name
   /face unless explicitly chosen; watermark; no public index.
31. **Risk/Rollback.** Privacy risk: oversharing children's images → conservative defaults +
   explicit opt-in. Rollback: disable share, keep in-app celebration.

---

## RELEASE TRAIN v2.0 — "Family & Network"

### F3.1 — Multi-Caregiver Access (Family Collaboration)

1. **Problem Statement.** A child is owned by exactly one `user`; partners, grandparents, and
   nannies cannot co-access. This caps DAU per family, blocks a viral loop, and mismatches how
   Indonesian families actually raise children.
2. **Business Goal.** Double+ active users per family; viral invitation loop; underpins a
   Family premium tier.
3. **User Goal.** "My partner and I (and grandma) see and update the same baby's record."
4. **Success Metrics.** Caregivers per child; invite acceptance rate; retention of multi-
   caregiver families vs single; Family-plan conversion.
6. **Target Users.** Both parents, extended family, caregivers.
7. **User Stories.** Owner invites a caregiver by email/link with a role (co-parent / viewer);
   invitee accepts and sees the child; roles bound permissions; owner can revoke.
8. **Acceptance Criteria.** Child access is mediated by a **membership** table, not the raw
   `children.userId`. Roles: `owner`, `editor`, `viewer`. All `resource()` reads/writes for
   child-scoped data resolve access through membership (owner retains delete). Invites expire;
   revocation immediate; audit of access changes.
9. **Functional Requirements.** This is the **largest architectural change in the roadmap**:
   ownership shifts from `userId`-on-row to membership-on-child. Strategy: introduce
   `child_members`; `ownsChild` becomes `canAccessChild(userId, childId, minRole)`; all
   child-scoped factory queries switch from `eq(userId)` to "child IN (my accessible children)"
   while **non-child-scoped** user data (subscriptions, coach usage) stays user-owned.
   Backward compat: every existing child gets an `owner` membership via backfill migration.
15. **Permissions.** owner: full incl. delete/share/invite; editor: CRUD child data; viewer:
   read-only. Premium "Family" tier governs how many caregivers (free: owner only; Family:
   N caregivers).
16. **DB.** `child_members` (id, childId, userId, role, invitedBy, createdAt);
   `child_invites` (id, childId, email, role, token, expiresAt, acceptedAt). Migration 0030.
   Backfill 0031 creates owner memberships from `children.userId`.
17. **API.** `POST /api/children/[id]/invites`, `POST /api/invites/[token]/accept`,
   `GET/DELETE /api/children/[id]/members`. All other child-scoped routes updated to
   membership checks.
18. **State.** Store gains `members` per child; child switcher shows shared children.
24. **Security.** Invite tokens unguessable + expiring; role checks server-side on every
   write; prevent privilege escalation (only owner assigns roles).
25. **Privacy.** Inviting shares a child's sensitive data — explicit consent screen; invitee
   must verify email (F0.6); revocation purges their access immediately.
27. **Testing.** Exhaustive authorization matrix tests (role × action × resource);
   backfill correctness; revoke-immediacy.
28. **Migration.** Two-phase: ship membership read-through (owner-only, behavior identical) →
   then enable invites. Lets the risky ownership refactor land before any user-visible change.
29. **Backward compat.** Phase-1 is behavior-identical (every child has exactly its owner).
31. **Risk/Rollback.** **Technical risk: HIGH** (touches every child-scoped query — an error
   = cross-family data exposure). Mitigation: phase rollout, membership read-through behind a
   flag, full authz test matrix, security review sign-off. Rollback: flag back to
   `userId`-only checks (data unaffected; invites disabled).

### F3.2 — Tiered Plans, Family Plan & Working Discounts

1. **Problem.** Single premium tier; weak hook; **discount-code system is dead** (admin can
   create codes that `/api/payment/snap` never applies); the admin **role-permission matrix
   is cosmetic** (enforcement uses hardcoded `ACCESS_POLICY`).
2. **Business Goal.** Higher ARPU + conversion; real promo capability; honest admin tools.
4. **Metrics.** Conversion by tier; promo redemption; ARPU; family-plan share.
8. **Acceptance Criteria.**
   - Plans: **Lite (free), Emas (individual premium), Keluarga (family)** with distinct
     `ACCESS_POLICY` rows and limits (caregivers, AI quota, etc.).
   - `/api/payment/snap` **applies a validated discount code** to `gross_amount` (validates
     active, not-expired, under `maxUsage`; increments `usedCount` atomically on settlement).
   - The admin **role-permission matrix either drives enforcement or is removed** — decision:
     make `ACCESS_POLICY` seed `role_permissions` and have `getUserPlan`-based gates read the
     DB matrix (single source of truth, admin-editable) with a code fallback. This resolves
     the documented drift.
9. **Functional.** Server-side price computation (never trust client amount — already true);
   discount validation server-side; tier→limits map centralized.
15. **Permissions.** Plan gates centralized; one helper `planAllows(userId, feature)`.
16. **DB.** `discount_codes` (exists) wired in; `role_permissions` (exists) becomes
   authoritative; add `plan` enum value `'family'`. Migration 0032.
24. **Security.** Discount + amount computed server-side; idempotent usage increment tied to
   settlement (in `applyOrderOutcome`); prevent code brute-force (rate limit validation).
31. **Risk/Rollback.** Business risk: pricing/promo bugs leak revenue → server-side compute +
   tests + idempotent increment. Rollback: disable discounts (revert to fixed `PLAN_PRICES`),
   keep tiers.

### F3.3 — "Buku Emas" Keepsake (Premium Upsell) & Offline Sync

- **Buku Emas:** generate an annual photo-book/PDF keepsake of the child's year (milestones,
  best journal moments, growth) — high-margin premium artifact parents love. Depends on
  journal media (F0.3) + report rendering (F1.5). Risk: print fulfillment partner (start with
  digital PDF; physical later). Rollback: digital-only.
- **Offline-first sync:** service worker (exists for push) extended to cache shell + queue
  writes; reconcile on reconnect. Enables reliable 3 a.m. logging and low-bandwidth reach.
  Risk: conflict resolution → last-write-wins per field + server timestamps; cap offline
  window. Rollback: online-only (current behavior).

### F3.4 — Posyandu / Buku KIA Bridge

- Import/export aligned with the paper Buku KIA and Posyandu cadre workflow (growth,
  immunization, KPSP). Depends on F1.1/F1.2/F1.4. Risk: format/standard ambiguity → start
  with structured PDF/CSV export matching Buku KIA sections; pursue official integration via
  partnership (v3.0). Rollback: export-only.

---

## RELEASE TRAIN v3.0 — "Platform"

Specified at concept level (full PRDs to be written when prioritized), each inheriting A.3:

- **F4.1 Pediatrician/Posyandu B2B Portal** — clinics onboard families; cadre batch KPSP;
  population dashboards (privacy-safe, aggregated). Depends on F3.1 (memberships) + F1.x.
- **F4.2 Vision-assisted milestone tagging** — photo → suggested milestone (on-device or
  server vision); strict consent; never auto-shares. Depends on F0.3 moderation + consent.
- **F4.3 Additional validated screens** — TDD/TDL, M-CHAT, GPPH/SDQ. Depends on F1.1 pattern.
- **F4.4 Anonymized population insights** — privacy-preserving aggregate growth/stunting
  trends for partners/government. Depends on robust consent + de-identification.

---

# PART C — DEPENDENCIES, MILESTONES, GATES

## C.1 Dependency Graph (text form)

```
F0.1 Tests ─────────────► (prerequisite for ALL math features: F1.1, F1.2, F1.3, F2.1)
F0.2 Env hardening ─────► (independent; do first, trivial)
F0.3 Upload moderation ─► F2.4 celebration share, F3.3 Buku Emas, F4.2 vision
F0.4 Observability ─────► (independent; do early — needed to measure everything after)
F0.5 CSP ───────────────► (independent)
F0.6 Email verify + i18n► F1.5 share PIN, F3.1 invites (invitee must verify), F3.2 billing
F0.7 Soft-delete ───────► (independent; protects all later user data)

F1.3 Corrected age ─────► F1.1 KPSP (form selection), F1.2 WHZ context, red-flags
F1.2 WHO WHZ ───────────► F1.5 report, F2.2 nutrition (low-WHZ surfacing)
F1.1 KPSP ──────────────► F1.5 report, F3.4 Posyandu bridge, F4.1 B2B, F4.3 screens
F1.4 Immunization ──────► F1.5 report, F2.3 proactive insights, F3.4 bridge
F1.5 Clinician report ──► F3.3 Buku Emas, F3.4 bridge

F-INFRA-2 Queue ────────► F1.4 due reminders (at scale), F2.0 reminders, F2.1, F2.3 digest
F2.0 Care logging ──────► F2.1 sleep insight, F2.3 insights
F2.1 Sleep insight ─────► (premium hook)
F2.2 MPASI ─────────────► F3.4 bridge (nutrition section)
F2.3 Digest/insights ───► retention

F3.1 Memberships ───────► F3.2 family tier, F4.1 B2B portal (HARD prerequisite)
F3.2 Tiers/discounts ───► monetization
F3.3 Buku Emas / Offline► keepsake + reliability
F3.4 Posyandu bridge ───► local moat
```

**Hard ordering rules:**
- **F0.1 before any clinical math change** (F1.1/1.2/1.3/2.1). Non-negotiable.
- **F1.3 (corrected age) before F1.1 (KPSP)** so preemie form selection is right from day one.
- **F3.1 (memberships) before F3.2 family tier and before any B2B.** It is the architectural
  pivot; build it phase-1 (behavior-identical) early to de-risk.
- **F-INFRA-2 before scaling reminders** (F1.4 ships with current cron; switch to queue when
  notification volume grows or before F2.x).

## C.2 Milestone Plan (each independently deployable & production-ready)

Numbering continues the existing `M##` log (last was **M58**). Each M = one verified,
committed, deployable cycle (per the established workflow: additive, gate-green, user
pushes & migrates prod).

**v1.1 (M59–M66)**
- M59 F0.2 Env hardening (no migration)
- M60 F0.1 Test harness + first golden suites (no migration)
- M61 F0.4 Observability + analytics wrapper (no migration)
- M62 F0.5 CSP report-only → M63 enforce
- M64 F0.3 Upload hardening + moderation + EXIF strip (migration 0013)
- M65 F0.6 Email verification on + i18n string layer (migration 0014 backfill)
- M66 F0.7 Soft-delete + export-before-delete (migration 0015)

**v1.2 (M67–M73)**
- M67 F1.3 Corrected age (migration 0018) — ship before KPSP
- M68 F1.2 WHO WHZ/BMI indicators (code data; optional cache migration 0017)
- M69–M70 F1.1 KPSP: content+scorer (M69, migration 0016 + seed) → UI+flow (M70)
- M71 F1.4 Immunization engine + due reminders (migration 0019)
- M72 F1.5 Clinician report + share PIN/revoke (migration 0020)
- M73 v1.2 clinical review sign-off + E2E pass (release gate)

**v1.5 (M74–M82)**
- M74 F-INFRA-2 queue (migration 0021)
- M75–M77 F2.0 care logging: feed (M75, 0022), diaper (M76, 0023), sleep extend (M77)
- M78 F2.1 sleep insight
- M79–M80 F2.2 MPASI (content M79 + planner M80, migrations 0024+)
- M81 F2.3 digest + proactive insights
- M82 F2.4 memory + celebration share

**v2.0 (M83–M90)**
- M83 F3.1 phase-1 memberships read-through (migration 0030 + backfill 0031, behavior-identical)
- M84 F3.1 phase-2 invites + roles UI
- M85 F3.2 tiers + family plan + wire discounts + matrix-as-source-of-truth (migration 0032)
- M86 F3.3 Buku Emas (digital) ; M87 offline sync
- M88–M89 F3.4 Posyandu/Buku KIA export → import
- M90 v2.0 security review (focus: membership authz matrix) + release gate

**v3.0 (M91+)** F4.x as separately PRD'd.

## C.3 Release Gates (per milestone & per train)

- **Per-milestone gate:** `tsc --noEmit` clean · `npm run lint` 0 errors · `npm run build` ·
  **`npm test` green + coverage threshold** (from v1.1) · migration is additive & applied to a
  preview branch · analytics events registered · a11y smoke pass.
- **Per-train gate:** E2E suite green · security review for trains touching authz/payments/
  media (v1.1, v2.0) · **clinical sign-off** for trains touching medical logic (v1.2, F2.1,
  F2.2) by a qualified reviewer (pediatrician/IDAI-aligned) · rollback plan rehearsed.

---

# PART D — RISK & ROLLBACK REGISTER (aggregate)

| Feature | Technical | UX | Business | Scientific | Security | Mitigation | Rollback |
|---|---|---|---|---|---|---|---|
| F0.1 Tests | Low | – | – | – | – | Phase in coverage gate | Drop gate, keep tests |
| F0.2 Env hardening | Low | – | Low (deploy fails loud) | – | **Closes critical** | Pre-merge env check | Warn instead of throw |
| F0.3 Upload moderation | Med | Med (false positives) | Med | – | **High (CSAM/legal)** | Manual review + appeal; EXIF strip | Disable auto-reject; keep folder+EXIF |
| F0.4 Observability | Low | – | – | – | PII scrub | Deny-list fields | Sampling→0 |
| F0.5 CSP | Med | – | – | – | High (XSS) | Report-only phase | Report-only/remove |
| F0.6 Email verify | Low | Med (friction) | Low | – | Med | Resend + grace browse | Flag off |
| F0.7 Soft-delete | Med | – | High (anti-churn) | – | Med (data lingers) | 30-day purge + erasure option | Keep export-only |
| F1.1 KPSP | Med | Med | High | **HIGH** | Med | Verbatim source+clinical review+scorer tests+versioning | Flag off (milestones fallback) |
| F1.2 WHZ | Med | Low | Med | **HIGH** | – | WHO vectors + tests | Hide UI, keep compute |
| F1.3 Corrected age | Low | Low | – | Med | – | Cutoff tests + review | Treat column null |
| F1.4 Immunization | Med | Low | Med | Med-High | – | IDAI source + version + review | Pin prior version |
| F1.5 Report/share | Med | Low | Med | Med | Med (token) | PIN+expiry+revoke | HTML-only, drop PDF |
| F-INFRA-2 Queue | High | – | – | – | Med | Idempotency+dedupe | Inline cron |
| F2.0 Care logging | Med | **High (friction)** | High (retention) | Low | – | 1-tap + timers; windowed queries | Flag per log type |
| F2.1 Sleep insight | Med | High | Med | Med | – | Range+disclaimer | Static guidance |
| F2.2 MPASI | Med | Med | High | **HIGH (allergen/choke)** | – | Clinical review + safety notes | Read-only guidance |
| F2.3 Digest/insights | Med | Med (fatigue) | High | Low | – | Frequency caps + prefs | Disable proactive |
| F2.4 Memory/share | Low | Low | High (viral) | – | **Med (child images)** | Conservative defaults + opt-in | Disable share |
| F3.1 Memberships | **HIGH (cross-family leak)** | Med | High | – | **HIGH** | Phased + authz matrix tests + sec review | Flag to userId-only |
| F3.2 Tiers/discounts | Med | Low | High (revenue) | – | Med (price/discount) | Server-side compute + idempotent usage + tests | Fixed prices |
| F3.3 Buku Emas/Offline | Med-High | Med | Med | – | Med | LWW conflict + bounded offline | Digital-only/online-only |
| F3.4 Posyandu bridge | Med | Low | Med (local moat) | Med | Med | Export-first; partnership for import | Export-only |

---

## Appendix — Open decisions requiring a human owner before build

1. **Clinical reviewer of record** — who signs off KPSP transcription, IDAI schedule version,
   MPASI safety, and WHZ vectors? (Blocks v1.2 train gate.)
2. **KPSP / IDAI content licensing & version** — confirm the exact official source edition to
   transcribe and cite.
3. **Pricing for Lite/Emas/Keluarga** and discount policy (blocks F3.2).
4. **Role-permission matrix decision** — confirm "DB matrix becomes source of truth" (this PRD's
   recommendation) vs "remove the cosmetic admin toggles." Either is acceptable; drift is not.
5. **Upload moderation provider** (Cloudinary add-on vs external) and legal CSAM-reporting
   obligations in Indonesia.
6. **Print-fulfillment partner** for physical Buku Emas (digital-first regardless).
```
