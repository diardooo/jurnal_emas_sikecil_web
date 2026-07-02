import { describe, expect, it } from "vitest";
import { isPremiumPurpose, resolveUploadFolder } from "@/lib/upload-policy";

describe("isPremiumPurpose (JES-110)", () => {
  it("gates journal & milestone photos behind Premium", () => {
    expect(isPremiumPurpose("journal")).toBe(true);
    expect(isPremiumPurpose("milestone")).toBe(true);
  });
  it("leaves profile & child photos free", () => {
    expect(isPremiumPurpose("profile")).toBe(false);
    expect(isPremiumPurpose("child")).toBe(false);
    expect(isPremiumPurpose("")).toBe(false);
  });
});

describe("resolveUploadFolder (JES-110)", () => {
  it("derives a per-user folder from an allow-listed purpose", () => {
    expect(resolveUploadFolder("u1", "journal")).toBe("jurnal-emas/u1/journal");
    expect(resolveUploadFolder("u1", "profile")).toBe("jurnal-emas/u1/profile");
  });

  it("buckets an unknown purpose under 'misc' (no injection)", () => {
    expect(resolveUploadFolder("u1", "../../secret")).toBe("jurnal-emas/u1/misc");
    expect(resolveUploadFolder("u1", "")).toBe("jurnal-emas/u1/misc");
    expect(resolveUploadFolder("u1", "anything")).toBe("jurnal-emas/u1/misc");
  });

  it("always scopes to the given (session) user id, never the client's", () => {
    expect(resolveUploadFolder("userA", "journal").startsWith("jurnal-emas/userA/")).toBe(true);
    expect(resolveUploadFolder("userB", "journal")).toBe("jurnal-emas/userB/journal");
  });
});
