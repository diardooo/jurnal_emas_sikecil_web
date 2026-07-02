import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Vitest config (JES-102). Unit/integration tests for the app's pure logic.
 *
 * - `@/` resolves to `src/` to mirror the tsconfig path alias, so tests import
 *   modules exactly as app code does (`@/lib/...`).
 * - Tests are colocated as `*.test.ts(x)` next to the code they cover.
 * - Coverage thresholds are intentionally scoped to the safety-critical modules
 *   (WHO growth math, red-flag screening, payment settlement, Midtrans signature)
 *   rather than the whole repo. Per the Developer Handbook these MUST stay at
 *   100%; a repo-wide gate is ratcheted up in a later sprint as coverage grows,
 *   so the gate never goes red simply because a UI file has no test yet.
 */
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts"],
      // Per-module thresholds are added by the SAME task that writes each
      // module's tests, so the gate never references a test that doesn't exist
      // yet. `who.ts` is covered by JES-103 (golden vectors). red-flags.ts /
      // payment-apply.ts follow in JES-104. The Developer Handbook target is
      // ~100% on math/safety modules; the small remainder on who.ts is an
      // unreachable defensive return. Thresholds are a ratchet — they fail the
      // gate if coverage regresses.
      thresholds: {
        "src/lib/who.ts": {
          statements: 95,
          branches: 88,
          functions: 100,
          lines: 95,
        },
      },
    },
  },
});
