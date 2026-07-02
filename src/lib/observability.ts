/**
 * Observability config + PII scrubbing (JES-106). Pure and Sentry-free so it is
 * unit-testable; the Sentry init files (`sentry.*.config.ts`, `instrumentation*`)
 * consume it. Capability-gated: with no DSN, Sentry is never initialised, so dev
 * and CI behave exactly as before.
 */

/** DSN from env (the public var also reaches the browser). Empty ⇒ disabled. */
export function sentryDsn(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || undefined;
}

export function sentryEnabled(): boolean {
  return !!sentryDsn();
}

/** Shared `Sentry.init` options (low sampling, PII off by default). */
export const sentryCommonOptions = {
  environment: process.env.NODE_ENV,
  sendDefaultPii: false as const,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
};

type ScrubbableEvent = {
  request?: {
    cookies?: unknown;
    data?: unknown;
    query_string?: unknown;
    headers?: Record<string, unknown>;
  };
  user?: Record<string, unknown>;
  extra?: Record<string, unknown>;
};

/** Keys that must never leave the app — free-text / personally identifying. */
const PII_KEYS = new Set([
  "name", "childName", "email", "phone", "password", "body",
  "title", "note", "question", "answer", "content", "message",
]);

function stripKeys(bag?: Record<string, unknown>): void {
  if (!bag) return;
  for (const key of Object.keys(bag)) if (PII_KEYS.has(key)) delete bag[key];
}

/**
 * Sentry `beforeSend` hook: strip PII / free-text before an event is sent —
 * request cookies/body/query, auth headers, user contact fields, and any known
 * PII key in `extra`. Children's data must never reach the error tracker.
 */
export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.query_string;
    const h = event.request.headers;
    if (h) {
      delete h.authorization;
      delete h.Authorization;
      delete h.cookie;
      delete h.Cookie;
    }
  }
  if (event.user) {
    delete event.user.email;
    delete event.user.username;
    delete event.user.ip_address;
  }
  stripKeys(event.extra);
  return event;
}
