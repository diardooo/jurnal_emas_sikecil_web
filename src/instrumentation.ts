import * as Sentry from "@sentry/nextjs";
import { assertProdEnv } from "@/lib/env";

/**
 * Next.js instrumentation hook — runs once when a server instance boots.
 *
 * 1. Production env guard (JES-101): fail fast & loud on misconfig. Skipped
 *    during `next build` and on non-Node runtimes.
 * 2. Sentry init (JES-106): load the matching runtime config. Each config is
 *    itself gated on the DSN, so with none set this is a harmless no-op.
 */
export async function register() {
  if (
    process.env.NEXT_PHASE !== "phase-production-build" &&
    (!process.env.NEXT_RUNTIME || process.env.NEXT_RUNTIME === "nodejs")
  ) {
    assertProdEnv();
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Capture errors thrown in nested React Server Components (Next → Sentry).
export const onRequestError = Sentry.captureRequestError;
