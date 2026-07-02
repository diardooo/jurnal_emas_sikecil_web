import { createHash } from "crypto";
import { describe, expect, it } from "vitest";
import {
  moderationStatusToMedia,
  parseModerationNotification,
  verifyCloudinaryCallback,
} from "./upload-moderation";

/**
 * Golden tests for the pure moderation-callback helpers (JES-111). Signature
 * verification gates whether foreign content can flip an asset's status, so it's
 * locked at 100% by the vitest per-module threshold.
 */
const SECRET = "cld-secret-123";
const TIMESTAMP = "1719900000";
const RAW = JSON.stringify({ notification_type: "moderation", public_id: "a/b" });

function signFor(rawBody: string, timestamp: string, secret: string) {
  return createHash("sha1").update(rawBody + timestamp + secret).digest("hex");
}

describe("verifyCloudinaryCallback", () => {
  it("accepts a correctly-signed payload", () => {
    const signature = signFor(RAW, TIMESTAMP, SECRET);
    expect(
      verifyCloudinaryCallback({ rawBody: RAW, timestamp: TIMESTAMP, signature, secret: SECRET }),
    ).toBe(true);
  });

  it("rejects a wrong signature of the same length", () => {
    const wrong = signFor(RAW, TIMESTAMP, "other-secret");
    expect(
      verifyCloudinaryCallback({ rawBody: RAW, timestamp: TIMESTAMP, signature: wrong, secret: SECRET }),
    ).toBe(false);
  });

  it("rejects a signature of a different length (no timingSafeEqual throw)", () => {
    expect(
      verifyCloudinaryCallback({ rawBody: RAW, timestamp: TIMESTAMP, signature: "abc", secret: SECRET }),
    ).toBe(false);
  });

  it("rejects when any of signature / timestamp / secret is empty", () => {
    const sig = signFor(RAW, TIMESTAMP, SECRET);
    expect(verifyCloudinaryCallback({ rawBody: RAW, timestamp: TIMESTAMP, signature: "", secret: SECRET })).toBe(false);
    expect(verifyCloudinaryCallback({ rawBody: RAW, timestamp: "", signature: sig, secret: SECRET })).toBe(false);
    expect(verifyCloudinaryCallback({ rawBody: RAW, timestamp: TIMESTAMP, signature: sig, secret: "" })).toBe(false);
  });
});

describe("moderationStatusToMedia", () => {
  it("maps approved / rejected verbatim and everything else to pending", () => {
    expect(moderationStatusToMedia("approved")).toBe("approved");
    expect(moderationStatusToMedia("rejected")).toBe("rejected");
    expect(moderationStatusToMedia("pending")).toBe("pending");
    expect(moderationStatusToMedia(undefined)).toBe("pending");
  });
});

describe("parseModerationNotification", () => {
  it("extracts publicId / status / kind from a moderation notification", () => {
    const r = parseModerationNotification({
      notification_type: "moderation",
      moderation_status: "rejected",
      moderation_kind: "aws_rek",
      public_id: "jurnal-emas/u1/x",
    });
    expect(r).toEqual({ publicId: "jurnal-emas/u1/x", status: "rejected", kind: "aws_rek" });
  });

  it("returns kind null when moderation_kind is absent", () => {
    const r = parseModerationNotification({
      notification_type: "moderation",
      moderation_status: "approved",
      public_id: "p",
    });
    expect(r).toEqual({ publicId: "p", status: "approved", kind: null });
  });

  it("returns null for non-objects, wrong type, or a missing/empty public_id", () => {
    expect(parseModerationNotification(null)).toBeNull();
    expect(parseModerationNotification("moderation")).toBeNull();
    expect(parseModerationNotification({ notification_type: "upload", public_id: "p" })).toBeNull();
    expect(parseModerationNotification({ notification_type: "moderation" })).toBeNull();
    expect(parseModerationNotification({ notification_type: "moderation", public_id: "" })).toBeNull();
  });
});
