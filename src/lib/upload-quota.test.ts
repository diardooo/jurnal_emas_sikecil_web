import { describe, expect, it } from "vitest";
import { checkUploadQuota } from "./upload-quota";
import { UPLOAD_DAILY_BYTES_CAP, UPLOAD_DAILY_LIMIT } from "./gating";

/**
 * Golden tests for the pure upload-quota decision (JES-111). Abuse control, so
 * locked at 100% by the vitest per-module threshold — both ceilings (daily count
 * and daily bytes) and the defensive clamp are exercised.
 */
const MB = 1024 * 1024;

describe("checkUploadQuota — daily count ceiling", () => {
  it("allows an upload well under the free ceiling and decrements remaining", () => {
    const d = checkUploadQuota({ count: 0, bytes: 0 }, 1 * MB, "free");
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(UPLOAD_DAILY_LIMIT.free - 1);
  });

  it("denies with reason 'count' at the free ceiling", () => {
    const d = checkUploadQuota({ count: UPLOAD_DAILY_LIMIT.free, bytes: 0 }, 1, "free");
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("count");
    expect(d.remaining).toBe(0);
  });

  it("gives Premium a higher ceiling (a free-denied count still passes)", () => {
    const atFree = UPLOAD_DAILY_LIMIT.free;
    expect(checkUploadQuota({ count: atFree, bytes: 0 }, 1, "free").allowed).toBe(false);
    expect(checkUploadQuota({ count: atFree, bytes: 0 }, 1, "premium").allowed).toBe(true);
  });
});

describe("checkUploadQuota — daily byte ceiling", () => {
  it("denies with reason 'bytes' when the incoming file would breach the cap", () => {
    const d = checkUploadQuota(
      { count: 1, bytes: UPLOAD_DAILY_BYTES_CAP.free },
      1,
      "free",
    );
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("bytes");
    // Count remaining is still reported even when the byte cap is the blocker.
    expect(d.remaining).toBe(UPLOAD_DAILY_LIMIT.free - 1);
  });

  it("allows landing exactly on the cap (boundary is not a breach)", () => {
    const d = checkUploadQuota(
      { count: 0, bytes: UPLOAD_DAILY_BYTES_CAP.free - 10 },
      10,
      "free",
    );
    expect(d.allowed).toBe(true);
  });
});

describe("checkUploadQuota — defensive", () => {
  it("clamps a negative incomingBytes to 0", () => {
    const d = checkUploadQuota({ count: 0, bytes: 0 }, -5, "free");
    expect(d.allowed).toBe(true);
    expect(d.remaining).toBe(UPLOAD_DAILY_LIMIT.free - 1);
  });
});
