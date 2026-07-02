import { describe, expect, it } from "vitest";
import { CSP_REPORT_PATH, buildCsp } from "@/lib/csp";

describe("buildCsp (JES-108)", () => {
  const csp = buildCsp();

  it("locks down the dangerous defaults", () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  it("allow-lists the app's real image hosts", () => {
    expect(csp).toContain("https://res.cloudinary.com");
    expect(csp).toContain("https://lh3.googleusercontent.com");
    expect(csp).toMatch(/img-src[^;]*'self'/);
  });

  it("routes violations to the report endpoint", () => {
    expect(csp).toContain(`report-uri ${CSP_REPORT_PATH}`);
    expect(CSP_REPORT_PATH).toBe("/api/csp-report");
  });

  it("emits well-formed directives (no empty directive, '; ' separated)", () => {
    const parts = csp.split("; ");
    expect(parts.length).toBeGreaterThan(8);
    for (const p of parts) {
      expect(p.trim()).not.toBe("");
      expect(p.split(" ").length).toBeGreaterThanOrEqual(2); // name + ≥1 value
    }
  });
});
