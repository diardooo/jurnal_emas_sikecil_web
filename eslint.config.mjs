import next from "eslint-config-next/core-web-vitals";

/**
 * Flat ESLint config. Next 16 removed the `next lint` command, and
 * eslint-config-next v16 ships a flat config requiring ESLint 9 — so linting
 * runs via the ESLint CLI (`eslint .`) against this file.
 *
 * The two React-Compiler-era `react-hooks` rules below are kept as warnings
 * (not errors): this codebase predates them and relies on intentional patterns
 * — e.g. closing the mobile menu on route change (topbar) and hydration-safe
 * `?? []` store selectors. They are performance/style hints, not regressions,
 * so they stay visible without blocking the gate. A dedicated cleanup pass can
 * ratchet them back to "error" later.
 */
const config = [
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "next-env.d.ts"] },
  ...next,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/use-memo": "warn",
    },
  },
];

export default config;
