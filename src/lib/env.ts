/**
 * Production environment guard (JES-101).
 *
 * `src/lib/auth.ts` falls back to a publicly-known secret
 * (`"dev-secret-change-me"`) and `db/index.ts` to a localhost DSN when env is
 * unset. Those fallbacks keep dev/demo frictionless, but in PRODUCTION a missing
 * or weak `BETTER_AUTH_SECRET` would make sessions forgeable. This module fails
 * the server boot **fast and loud** instead of coming up silently insecure.
 *
 * Pure + testable: `validateProdEnv` returns the list of problems for any env
 * object; `assertProdEnv` applies the `NODE_ENV==="production"` gate and throws.
 * It is wired into `src/instrumentation.ts` (runs once at server startup) and is
 * deliberately skipped during `next build` so CI's dummy build-time secrets do
 * not trip it.
 */

type Env = Record<string, string | undefined>;

/** Minimum length for a real auth secret (Better Auth signs sessions with it). */
export const MIN_SECRET_LENGTH = 32;

/** Known placeholder/sample secrets that must never reach production. */
const WEAK_SECRETS = new Set([
  "dev-secret-change-me", // lib/auth.ts dev fallback
  "change-me-to-a-long-random-string", // .env.example placeholder
  "ci-build-secret-not-used-at-runtime", // CI build-time dummy
]);

/**
 * Return every production-config problem found in `env` (empty array = OK).
 * Does NOT consult `NODE_ENV` — it reports problems regardless of environment so
 * it can be unit-tested directly. The environment gate lives in `assertProdEnv`.
 */
export function validateProdEnv(env: Env = process.env): string[] {
  const errors: string[] = [];

  const secret = env.BETTER_AUTH_SECRET;
  if (!secret) {
    errors.push("BETTER_AUTH_SECRET wajib diisi di produksi.");
  } else {
    if (secret.length < MIN_SECRET_LENGTH) {
      errors.push(
        `BETTER_AUTH_SECRET minimal ${MIN_SECRET_LENGTH} karakter (sekarang ${secret.length}).`,
      );
    }
    if (WEAK_SECRETS.has(secret)) {
      errors.push(
        "BETTER_AUTH_SECRET masih memakai nilai default/contoh — ganti dengan string acak yang panjang.",
      );
    }
  }

  const url = env.BETTER_AUTH_URL;
  if (!url) {
    errors.push("BETTER_AUTH_URL wajib diisi di produksi.");
  } else if (!url.startsWith("https://")) {
    errors.push(`BETTER_AUTH_URL harus HTTPS di produksi (sekarang "${url}").`);
  }

  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL wajib diisi di produksi.");
  }

  return errors;
}

/**
 * Throw (failing the server boot) if `env` is production and misconfigured.
 * No-op in any non-production environment, so dev/demo are unaffected.
 */
export function assertProdEnv(env: Env = process.env): void {
  if (env.NODE_ENV !== "production") return;
  const errors = validateProdEnv(env);
  if (errors.length > 0) {
    throw new Error(
      "Konfigurasi produksi tidak aman — boot dihentikan:\n" +
        errors.map((e) => `  • ${e}`).join("\n"),
    );
  }
}
