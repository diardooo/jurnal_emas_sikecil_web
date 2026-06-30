import { assertProdEnv } from "@/lib/env";

/**
 * Next.js instrumentation hook (JES-101). `register()` runs once when a server
 * instance boots. We use it to fail fast & loud when production is misconfigured
 * (weak/missing auth secret, non-HTTPS base URL, missing DB) so a deploy can
 * never come up silently insecure.
 *
 * Guards:
 * - Skip during `next build` (`NEXT_PHASE === "phase-production-build"`) so the
 *   CI build's dummy build-time secrets don't trip the runtime check.
 * - Run only on the Node.js runtime (the edge runtime re-invokes `register` with
 *   a restricted env; the Node boot is the authoritative one).
 */
export function register() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  assertProdEnv();
}
