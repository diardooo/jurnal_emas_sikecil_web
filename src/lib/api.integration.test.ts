import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Point the app's db client at the in-memory pglite instance. Schema tables
// (imported from @/db/schema/*) stay REAL, so scoping SQL runs for real.
vi.mock("@/db", async () => {
  const mod = await import("@/test/pglite");
  return { db: mod.testDb, schema: mod.schema };
});

// Control the "current user" per request via an x-test-user header, bypassing
// Better Auth's cookie/session machinery (out of scope here).
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

import { user } from "@/db/schema/auth";
import { children, tasks } from "@/db/schema/app";
import { resource } from "@/lib/api";
import { adminResource } from "@/lib/admin";
import { discountCodes } from "@/db/schema/admin";
import { initTestDb, testDb, truncateAll } from "@/test/pglite";

/** Minimal request stub exposing exactly what the handlers read. */
function makeReq(opts: { userId?: string | null; body?: unknown; search?: string }): NextRequest {
  const headers = new Headers();
  if (opts.userId) headers.set("x-test-user", opts.userId);
  const nextUrl = new URL("http://test/api" + (opts.search ? `?${opts.search}` : ""));
  return {
    headers,
    nextUrl,
    json: async () => opts.body ?? {},
  } as unknown as NextRequest;
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function seedUser(id: string, role = "user", status = "active") {
  await testDb.insert(user).values({
    id,
    name: id,
    email: `${id}@test.local`,
    emailVerified: true,
    role,
    status,
  });
}

const childApi = resource(children);
const taskApi = resource(tasks);

beforeAll(async () => {
  await initTestDb();
});
beforeEach(async () => {
  await truncateAll();
});

describe("resource() — per-user ownership scoping (JES-105)", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await childApi.GET(makeReq({ userId: null }));
    expect(res.status).toBe(401);
  });

  it("a user only sees their OWN rows on GET", async () => {
    await seedUser("userA");
    await seedUser("userB");
    const created = await (
      await childApi.POST(makeReq({ userId: "userA", body: { name: "Kyara", dob: "2024-01-01", gender: "L" } }))
    ).json();
    expect(created.id).toBeTruthy();
    expect(created.userId).toBe("userA");

    const aList = await (await childApi.GET(makeReq({ userId: "userA" }))).json();
    const bList = await (await childApi.GET(makeReq({ userId: "userB" }))).json();
    expect(aList).toHaveLength(1);
    expect(bList).toHaveLength(0); // userB cannot see userA's child
  });

  it("user B cannot PATCH user A's row (404, and data unchanged)", async () => {
    await seedUser("userA");
    await seedUser("userB");
    const child = await (
      await childApi.POST(makeReq({ userId: "userA", body: { name: "Kyara", dob: "2024-01-01", gender: "L" } }))
    ).json();

    const res = await childApi.PATCH(
      makeReq({ userId: "userB", body: { name: "HACKED" } }),
      params(child.id),
    );
    expect(res.status).toBe(404);

    const still = await (await childApi.GET(makeReq({ userId: "userA" }))).json();
    expect(still[0].name).toBe("Kyara"); // untouched
  });

  it("user B cannot DELETE user A's row (404, and row survives)", async () => {
    await seedUser("userA");
    await seedUser("userB");
    const child = await (
      await childApi.POST(makeReq({ userId: "userA", body: { name: "Kyara", dob: "2024-01-01", gender: "L" } }))
    ).json();

    const res = await childApi.DELETE(makeReq({ userId: "userB" }), params(child.id));
    expect(res.status).toBe(404);
    expect(await (await childApi.GET(makeReq({ userId: "userA" }))).json()).toHaveLength(1);
  });

  it("the owner CAN patch and delete their own row", async () => {
    await seedUser("userA");
    const child = await (
      await childApi.POST(makeReq({ userId: "userA", body: { name: "Kyara", dob: "2024-01-01", gender: "L" } }))
    ).json();

    const patched = await (
      await childApi.PATCH(makeReq({ userId: "userA", body: { name: "Kyara Z" } }), params(child.id))
    ).json();
    expect(patched.name).toBe("Kyara Z");

    const del = await childApi.DELETE(makeReq({ userId: "userA" }), params(child.id));
    expect(del.status).toBe(200);
    expect(await (await childApi.GET(makeReq({ userId: "userA" }))).json()).toHaveLength(0);
  });
});

describe("resource() — child ownership on writes (ownsChild)", () => {
  it("blocks creating a child-scoped row against someone else's child (400)", async () => {
    await seedUser("userA");
    await seedUser("userB");
    const child = await (
      await childApi.POST(makeReq({ userId: "userA", body: { name: "Kyara", dob: "2024-01-01", gender: "L" } }))
    ).json();

    // userB tries to attach a task to userA's child.
    const res = await taskApi.POST(
      makeReq({ userId: "userB", body: { title: "spy", childId: child.id } }),
    );
    expect(res.status).toBe(400);
  });

  it("allows creating a child-scoped row against one's own child (201)", async () => {
    await seedUser("userA");
    const child = await (
      await childApi.POST(makeReq({ userId: "userA", body: { name: "Kyara", dob: "2024-01-01", gender: "L" } }))
    ).json();
    const res = await taskApi.POST(
      makeReq({ userId: "userA", body: { title: "vaksin", childId: child.id } }),
    );
    expect(res.status).toBe(201);
  });

  it("scopes GET by childId only within the user's own data", async () => {
    await seedUser("userA");
    const child = await (
      await childApi.POST(makeReq({ userId: "userA", body: { name: "Kyara", dob: "2024-01-01", gender: "L" } }))
    ).json();
    await taskApi.POST(makeReq({ userId: "userA", body: { title: "t1", childId: child.id } }));
    const list = await (await taskApi.GET(makeReq({ userId: "userA", search: `childId=${child.id}` }))).json();
    expect(list).toHaveLength(1);
  });

  it("prevents mass-assigning userId (whitelist ignores it)", async () => {
    await seedUser("userA");
    const created = await (
      await childApi.POST(
        makeReq({ userId: "userA", body: { name: "X", dob: "2024-01-01", gender: "L", userId: "userB" } }),
      )
    ).json();
    expect(created.userId).toBe("userA"); // body userId ignored
  });
});

describe("adminResource() — role gating (getAdmin)", () => {
  const discountApi = adminResource(discountCodes);

  it("forbids a normal user (403)", async () => {
    await seedUser("normal", "user");
    const res = await discountApi.GET(makeReq({ userId: "normal" }));
    expect(res.status).toBe(403);
  });

  it("forbids a suspended admin (403)", async () => {
    await seedUser("susp", "admin", "suspended");
    const res = await discountApi.GET(makeReq({ userId: "susp" }));
    expect(res.status).toBe(403);
  });

  it("allows an active admin (200)", async () => {
    await seedUser("boss", "admin");
    const res = await discountApi.GET(makeReq({ userId: "boss" }));
    expect(res.status).toBe(200);
  });
});
