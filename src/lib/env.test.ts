import { describe, expect, it } from "vitest";
import { MIN_SECRET_LENGTH, assertProdEnv, validateProdEnv } from "@/lib/env";

/** A 40-char random-ish secret that passes every rule. */
const STRONG_SECRET = "x7Kp9_qLm2Vn4Rt6Wz8Bc0Df1Gh3Jk5Mn7Pq9Rs";
const VALID_PROD = {
  NODE_ENV: "production",
  BETTER_AUTH_SECRET: STRONG_SECRET,
  BETTER_AUTH_URL: "https://app.example.com",
  DATABASE_URL: "postgres://user:pass@host:5432/db",
};

describe("validateProdEnv (JES-101)", () => {
  it("returns no errors for a fully valid config", () => {
    expect(validateProdEnv(VALID_PROD)).toEqual([]);
  });

  it("flags a missing secret", () => {
    const errs = validateProdEnv({ ...VALID_PROD, BETTER_AUTH_SECRET: undefined });
    expect(errs.some((e) => e.includes("BETTER_AUTH_SECRET wajib"))).toBe(true);
  });

  it("flags a too-short secret", () => {
    const errs = validateProdEnv({ ...VALID_PROD, BETTER_AUTH_SECRET: "short" });
    expect(errs.some((e) => e.includes(`minimal ${MIN_SECRET_LENGTH}`))).toBe(true);
  });

  it("flags the known dev/default secrets even if long enough", () => {
    for (const weak of [
      "dev-secret-change-me",
      "change-me-to-a-long-random-string",
      "ci-build-secret-not-used-at-runtime",
    ]) {
      const errs = validateProdEnv({ ...VALID_PROD, BETTER_AUTH_SECRET: weak });
      expect(errs.some((e) => e.includes("default/contoh"))).toBe(true);
    }
  });

  it("flags a non-HTTPS base URL", () => {
    const errs = validateProdEnv({ ...VALID_PROD, BETTER_AUTH_URL: "http://app.example.com" });
    expect(errs.some((e) => e.includes("harus HTTPS"))).toBe(true);
  });

  it("flags a missing base URL and missing database", () => {
    const errs = validateProdEnv({
      ...VALID_PROD,
      BETTER_AUTH_URL: undefined,
      DATABASE_URL: undefined,
    });
    expect(errs.some((e) => e.includes("BETTER_AUTH_URL wajib"))).toBe(true);
    expect(errs.some((e) => e.includes("DATABASE_URL wajib"))).toBe(true);
  });

  it("reports ALL problems at once, not just the first", () => {
    const errs = validateProdEnv({
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "short",
      BETTER_AUTH_URL: "http://x",
      DATABASE_URL: undefined,
    });
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("assertProdEnv (JES-101)", () => {
  it("does not throw when production config is valid", () => {
    expect(() => assertProdEnv(VALID_PROD)).not.toThrow();
  });

  it("throws and lists every problem when production is misconfigured", () => {
    expect(() =>
      assertProdEnv({ NODE_ENV: "production", BETTER_AUTH_SECRET: "dev-secret-change-me" }),
    ).toThrow(/boot dihentikan/);
  });

  it("is a NO-OP outside production, even with everything missing", () => {
    expect(() => assertProdEnv({ NODE_ENV: "development" })).not.toThrow();
    expect(() => assertProdEnv({ NODE_ENV: undefined })).not.toThrow();
    expect(() => assertProdEnv({ NODE_ENV: "test" })).not.toThrow();
  });
});
