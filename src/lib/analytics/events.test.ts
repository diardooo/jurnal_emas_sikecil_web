import { describe, expect, it } from "vitest";
import { ageBucket, buildEventProps, isAnalyticsEvent } from "@/lib/analytics/events";

describe("isAnalyticsEvent (JES-107)", () => {
  it("accepts registered events", () => {
    expect(isAnalyticsEvent("coach.question_asked")).toBe(true);
    expect(isAnalyticsEvent("billing.checkout_settled")).toBe(true);
  });
  it("rejects unregistered events", () => {
    expect(isAnalyticsEvent("random.event")).toBe(false);
    expect(isAnalyticsEvent("")).toBe(false);
  });
});

describe("ageBucket", () => {
  it("maps months to coarse buckets", () => {
    expect(ageBucket(0)).toBe("0-5m");
    expect(ageBucket(5)).toBe("0-5m");
    expect(ageBucket(6)).toBe("6-11m");
    expect(ageBucket(12)).toBe("12-23m");
    expect(ageBucket(24)).toBe("24-35m");
    expect(ageBucket(36)).toBe("36-59m");
    expect(ageBucket(60)).toBe("60m+");
    expect(ageBucket(120)).toBe("60m+");
  });
  it("returns undefined for missing / invalid ages", () => {
    expect(ageBucket(undefined)).toBeUndefined();
    expect(ageBucket(-1)).toBeUndefined();
    expect(ageBucket(NaN)).toBeUndefined();
  });
});

describe("buildEventProps", () => {
  it("keeps safe scalar props", () => {
    expect(buildEventProps({ plan: "premium", surface: "dashboard" })).toEqual({
      plan: "premium",
      surface: "dashboard",
    });
  });

  it("buckets childAgeMonths and never sends the raw age", () => {
    const out = buildEventProps({ childAgeMonths: 30, plan: "free" });
    expect(out).toEqual({ ageBucket: "24-35m", plan: "free" });
    expect(out.childAgeMonths).toBeUndefined();
  });

  it("strips PII / free-text keys", () => {
    const out = buildEventProps({
      plan: "free",
      name: "Kyara",
      email: "a@b.com",
      body: "catatan rahasia",
      userId: "u1",
      question: "apakah...",
    });
    expect(out).toEqual({ plan: "free" });
  });

  it("drops undefined values and tolerates an empty bag", () => {
    expect(buildEventProps({ plan: undefined, surface: "x" })).toEqual({ surface: "x" });
    expect(buildEventProps()).toEqual({});
  });
});
