/**
 * Analytics taxonomy + payload builder (JES-107).
 *
 * Naming is `domain.object_action`. Every event is registered here — the typed
 * `track()` wrapper refuses anything not in this list, so the event set can't
 * drift feature-by-feature.
 *
 * Privacy by design: we deliberately attach NO user identifier (not even a
 * hashed one) to events, and `buildEventProps` strips any free-text / PII key.
 * Child age is only ever sent as a coarse bucket, never the raw month count.
 */
export const ANALYTICS_EVENTS = [
  "onboarding.started",
  "onboarding.child_added",
  "growth.measurement_added",
  "milestone.marked",
  "kpsp.screening_completed",
  "coach.question_asked",
  "billing.checkout_started",
  "billing.checkout_settled",
  "report.shared",
  "upload.photo_added",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

const EVENT_SET = new Set<string>(ANALYTICS_EVENTS);

export function isAnalyticsEvent(name: string): name is AnalyticsEvent {
  return EVENT_SET.has(name);
}

export type AnalyticsProps = {
  plan?: "free" | "premium";
  /** Raw age — converted to a coarse `ageBucket`; the raw value is never sent. */
  childAgeMonths?: number;
  surface?: string;
  [key: string]: string | number | boolean | undefined;
};

/** Keys we must never forward to analytics (free-text / personally identifying). */
const PII_KEYS = new Set([
  "name", "childName", "email", "phone", "body", "title",
  "note", "question", "answer", "content", "message", "url", "userId",
]);

/** Coarse age bucket so cohorting never exposes an exact age. */
export function ageBucket(months?: number): string | undefined {
  if (months == null || Number.isNaN(months) || months < 0) return undefined;
  if (months < 6) return "0-5m";
  if (months < 12) return "6-11m";
  if (months < 24) return "12-23m";
  if (months < 36) return "24-35m";
  if (months < 60) return "36-59m";
  return "60m+";
}

/** Build a safe, PII-free property bag for an event. */
export function buildEventProps(props: AnalyticsProps = {}): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (PII_KEYS.has(key)) continue;
    if (key === "childAgeMonths") continue; // bucketed separately below
    out[key] = value;
  }
  const bucket = ageBucket(props.childAgeMonths);
  if (bucket) out.ageBucket = bucket;
  return out;
}
