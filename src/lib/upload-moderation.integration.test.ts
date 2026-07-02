import { createHash } from "crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

// Real schema + SQL against pglite; header-driven fake session (same wiring as
// the other integration suites). Cloudinary is kept REAL for `cloudinaryConfigured`
// (env-driven) but its network `uploadImage` is stubbed so no HTTP is made.
vi.mock("@/db", async () => {
  const mod = await import("@/test/pglite");
  return { db: mod.testDb, schema: mod.schema };
});
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        const id = headers.get("x-test-user");
        return id ? { user: { id } } : null;
      },
    },
  },
}));
vi.mock("@/lib/cloudinary", async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    uploadImage: vi.fn(async () => ({
      url: "https://res.cloudinary.com/demo/image/upload/x.jpg",
      publicId: "jurnal-emas/u1/profile/x",
    })),
  };
});

import { user } from "@/db/schema/auth";
import { mediaAssets, uploadUsage } from "@/db/schema/app";
import { UPLOAD_DAILY_LIMIT } from "@/lib/gating";
import { initTestDb, testDb, truncateAll } from "@/test/pglite";
import { POST as callbackPOST } from "@/app/api/upload/moderation-callback/route";
import { POST as uploadPOST } from "@/app/api/upload/route";

const SECRET = "test-cloudinary-secret";
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
const today = () => new Date().toISOString().slice(0, 10);

function callbackReq(rawBody: string, headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers), text: async () => rawBody } as unknown as NextRequest;
}
function signedHeaders(rawBody: string, timestamp: string, secret = SECRET) {
  const signature = createHash("sha1").update(rawBody + timestamp + secret).digest("hex");
  return { "x-cld-signature": signature, "x-cld-timestamp": timestamp };
}
function uploadReq(userId: string, opts: { purpose?: string; bytes?: number } = {}): NextRequest {
  const bytes = opts.bytes ?? PNG.length;
  const buf = new Uint8Array(bytes);
  buf.set(PNG.slice(0, Math.min(PNG.length, bytes)));
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "image/png" }));
  fd.append("purpose", opts.purpose ?? "profile");
  return {
    headers: new Headers({ "x-test-user": userId }),
    formData: async () => fd,
  } as unknown as NextRequest;
}

async function seedUser(id: string) {
  await testDb.insert(user).values({ id, name: id, email: `${id}@test.local`, emailVerified: true });
}

beforeAll(async () => {
  await initTestDb();
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = SECRET;
});
afterAll(() => {
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
});
beforeEach(async () => {
  await truncateAll();
});

describe("JES-111 — moderation-callback route", () => {
  async function seedAsset(userId: string, publicId: string) {
    await seedUser(userId);
    await testDb
      .insert(mediaAssets)
      .values({ userId, publicId, url: "https://x/y.jpg", purpose: "profile", status: "pending" });
  }

  it("a valid signature flips a pending asset to approved", async () => {
    await seedAsset("u1", "pid-approve");
    const body = JSON.stringify({
      notification_type: "moderation",
      moderation_status: "approved",
      moderation_kind: "aws_rek",
      public_id: "pid-approve",
    });
    const res = await callbackPOST(callbackReq(body, signedHeaders(body, "100")));
    expect(res.status).toBe(200);
    const [row] = await testDb.select().from(mediaAssets).where(eq(mediaAssets.publicId, "pid-approve"));
    expect(row.status).toBe("approved");
    expect(row.moderationKind).toBe("aws_rek");
  });

  it("a rejected verdict hides the asset (status rejected)", async () => {
    await seedAsset("u1", "pid-reject");
    const body = JSON.stringify({
      notification_type: "moderation",
      moderation_status: "rejected",
      public_id: "pid-reject",
    });
    const res = await callbackPOST(callbackReq(body, signedHeaders(body, "101")));
    expect(res.status).toBe(200);
    const [row] = await testDb.select().from(mediaAssets).where(eq(mediaAssets.publicId, "pid-reject"));
    expect(row.status).toBe("rejected");
  });

  it("an invalid signature is rejected (401) and never mutates status", async () => {
    await seedAsset("u1", "pid-forge");
    const body = JSON.stringify({
      notification_type: "moderation",
      moderation_status: "approved",
      public_id: "pid-forge",
    });
    const res = await callbackPOST(
      callbackReq(body, { "x-cld-signature": "deadbeef", "x-cld-timestamp": "102" }),
    );
    expect(res.status).toBe(401);
    const [row] = await testDb.select().from(mediaAssets).where(eq(mediaAssets.publicId, "pid-forge"));
    expect(row.status).toBe("pending"); // untouched
  });

  it("a valid signature for an unknown asset acks 200 without error", async () => {
    const body = JSON.stringify({
      notification_type: "moderation",
      moderation_status: "approved",
      public_id: "does-not-exist",
    });
    const res = await callbackPOST(callbackReq(body, signedHeaders(body, "103")));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(false);
  });

  it("returns 503 when Cloudinary is not configured", async () => {
    const saved = process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    try {
      const res = await callbackPOST(callbackReq("{}", { "x-cld-signature": "x", "x-cld-timestamp": "1" }));
      expect(res.status).toBe(503);
    } finally {
      process.env.CLOUDINARY_CLOUD_NAME = "demo";
      process.env.CLOUDINARY_API_KEY = "key";
      process.env.CLOUDINARY_API_SECRET = saved;
    }
  });
});

describe("JES-111 — upload route daily quota", () => {
  it("records a media asset + increments usage on a successful upload", async () => {
    await seedUser("u1");
    const res = await uploadPOST(uploadReq("u1", { bytes: 1000 }));
    expect(res.status).toBe(200);

    const assets = await testDb.select().from(mediaAssets).where(eq(mediaAssets.userId, "u1"));
    expect(assets).toHaveLength(1);
    expect(assets[0].status).toBe("approved");

    const [usage] = await testDb.select().from(uploadUsage).where(eq(uploadUsage.userId, "u1"));
    expect(usage.count).toBe(1);
    expect(usage.bytes).toBe(1000);
  });

  it("blocks with 429 once the free daily count is reached, before hitting Cloudinary", async () => {
    await seedUser("u1");
    await testDb
      .insert(uploadUsage)
      .values({ userId: "u1", date: today(), count: UPLOAD_DAILY_LIMIT.free, bytes: 0 });

    const res = await uploadPOST(uploadReq("u1"));
    expect(res.status).toBe(429);
    // No asset row was created — the request never reached the upload.
    expect(await testDb.select().from(mediaAssets).where(eq(mediaAssets.userId, "u1"))).toHaveLength(0);
  });
});
