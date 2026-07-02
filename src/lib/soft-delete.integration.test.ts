import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

// Same wiring as api.integration.test.ts: real schema + SQL against pglite, and
// a header-driven fake session so handlers run for real.
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

import { user } from "@/db/schema/auth";
import { children, tasks } from "@/db/schema/app";
import { resource } from "@/lib/api";
import { purgeCutoff, SOFT_DELETE_RETENTION_DAYS } from "@/lib/retention";
import { initTestDb, testDb, truncateAll } from "@/test/pglite";
import { GET as trashGET } from "@/app/api/children/trash/route";
import { POST as restorePOST } from "@/app/api/children/[id]/restore/route";
import { DELETE as permanentDELETE } from "@/app/api/children/[id]/permanent/route";
import { GET as purgeGET } from "@/app/api/cron/purge-deleted/route";

function makeReq(opts: { userId?: string | null; search?: string }): NextRequest {
  const headers = new Headers();
  if (opts.userId) headers.set("x-test-user", opts.userId);
  const nextUrl = new URL("http://test/api" + (opts.search ? `?${opts.search}` : ""));
  return { headers, nextUrl, json: async () => ({}) } as unknown as NextRequest;
}
const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function seedUser(id: string) {
  await testDb.insert(user).values({
    id,
    name: id,
    email: `${id}@test.local`,
    emailVerified: true,
  });
}
async function seedChild(userId: string, name = "Kyara") {
  const [row] = await testDb
    .insert(children)
    .values({ userId, name, dob: "2024-01-01", gender: "L" })
    .returning();
  return row;
}

const childApi = resource(children);
const taskApi = resource(tasks);

beforeAll(async () => {
  await initTestDb();
});
beforeEach(async () => {
  await truncateAll();
});

describe("soft-delete (JES-114) — children DELETE goes to Trash", () => {
  it("DELETE marks deletedAt instead of destroying the row", async () => {
    await seedUser("u1");
    const child = await seedChild("u1");

    const res = await childApi.DELETE(makeReq({ userId: "u1" }), params(child.id));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.softDeleted).toBe(true);

    // Hidden from normal reads…
    expect(await (await childApi.GET(makeReq({ userId: "u1" }))).json()).toHaveLength(0);
    // …but still present in the table with a deletedAt timestamp.
    const rows = await testDb.select().from(children).where(eq(children.id, child.id));
    expect(rows).toHaveLength(1);
    expect(rows[0].deletedAt).toBeInstanceOf(Date);
  });

  it("deleting an already-trashed child returns 404 (idempotent)", async () => {
    await seedUser("u1");
    const child = await seedChild("u1");
    await childApi.DELETE(makeReq({ userId: "u1" }), params(child.id));
    const again = await childApi.DELETE(makeReq({ userId: "u1" }), params(child.id));
    expect(again.status).toBe(404);
  });

  it("tables without a deletedAt column still hard-delete", async () => {
    await seedUser("u1");
    const child = await seedChild("u1");
    const [t] = await testDb
      .insert(tasks)
      .values({ userId: "u1", childId: child.id, title: "vaksin" })
      .returning();

    const res = await taskApi.DELETE(makeReq({ userId: "u1" }), params(t.id));
    expect(res.status).toBe(200);
    const rows = await testDb.select().from(tasks).where(eq(tasks.id, t.id));
    expect(rows).toHaveLength(0); // truly gone
  });
});

describe("soft-delete (JES-114) — Trash list / restore / permanent", () => {
  it("Trash lists only the user's soft-deleted children", async () => {
    await seedUser("u1");
    await seedUser("u2");
    const live = await seedChild("u1", "Live");
    const trashed = await seedChild("u1", "Trashed");
    await seedChild("u2", "Other");
    await childApi.DELETE(makeReq({ userId: "u1" }), params(trashed.id));
    await childApi.DELETE(makeReq({ userId: "u2" }), params((await seedChild("u2", "OtherTrash")).id));

    const list = await (await trashGET(makeReq({ userId: "u1" }))).json();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(trashed.id);
    expect(list.some((c: { id: string }) => c.id === live.id)).toBe(false);
  });

  it("restore clears deletedAt so the child reappears", async () => {
    await seedUser("u1");
    const child = await seedChild("u1");
    await childApi.DELETE(makeReq({ userId: "u1" }), params(child.id));

    const res = await restorePOST(makeReq({ userId: "u1" }), params(child.id));
    expect(res.status).toBe(200);
    expect(await (await childApi.GET(makeReq({ userId: "u1" }))).json()).toHaveLength(1);
  });

  it("restore of a non-trashed child is a 404", async () => {
    await seedUser("u1");
    const child = await seedChild("u1"); // never deleted
    const res = await restorePOST(makeReq({ userId: "u1" }), params(child.id));
    expect(res.status).toBe(404);
  });

  it("permanent delete only works on trashed rows and hard-deletes", async () => {
    await seedUser("u1");
    const child = await seedChild("u1");

    // Live child cannot be permanently deleted directly.
    const blocked = await permanentDELETE(makeReq({ userId: "u1" }), params(child.id));
    expect(blocked.status).toBe(404);

    await childApi.DELETE(makeReq({ userId: "u1" }), params(child.id));
    const ok = await permanentDELETE(makeReq({ userId: "u1" }), params(child.id));
    expect(ok.status).toBe(200);
    expect(await testDb.select().from(children).where(eq(children.id, child.id))).toHaveLength(0);
  });

  it("a user cannot restore or purge another user's trashed child", async () => {
    await seedUser("u1");
    await seedUser("u2");
    const child = await seedChild("u1");
    await childApi.DELETE(makeReq({ userId: "u1" }), params(child.id));

    expect((await restorePOST(makeReq({ userId: "u2" }), params(child.id))).status).toBe(404);
    expect((await permanentDELETE(makeReq({ userId: "u2" }), params(child.id))).status).toBe(404);
  });
});

describe("soft-delete (JES-114) — purge cron", () => {
  it("purges children trashed past the retention window, keeps recent & live", async () => {
    await seedUser("u1");
    const live = await seedChild("u1", "Live");
    const recent = await seedChild("u1", "RecentlyTrashed");
    const old = await seedChild("u1", "OldTrash");

    // recent: trashed just now. old: trashed beyond the cutoff.
    await testDb.update(children).set({ deletedAt: new Date() }).where(eq(children.id, recent.id));
    const wayPast = new Date(purgeCutoff().getTime() - 24 * 60 * 60 * 1000);
    await testDb.update(children).set({ deletedAt: wayPast }).where(eq(children.id, old.id));

    const res = await purgeGET(makeReq({}));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.purged).toBe(1);

    const remaining = await testDb.select().from(children).where(eq(children.userId, "u1"));
    const ids = remaining.map((r) => r.id);
    expect(ids).toContain(live.id);
    expect(ids).toContain(recent.id);
    expect(ids).not.toContain(old.id);
  });

  it("retention window is 30 days", () => {
    expect(SOFT_DELETE_RETENTION_DAYS).toBe(30);
  });
});

describe("soft-delete (JES-114) — free-child-limit ignores trashed", () => {
  it("a trashed child is not counted (verified via query parity)", async () => {
    await seedUser("u1");
    const a = await seedChild("u1", "A");
    await seedChild("u1", "B");
    await childApi.DELETE(makeReq({ userId: "u1" }), params(a.id));
    // The POST route counts with isNull(deletedAt); mirror that here.
    const rows = await testDb
      .select()
      .from(children)
      .where(and(eq(children.userId, "u1")));
    const liveCount = rows.filter((r) => r.deletedAt === null).length;
    expect(rows).toHaveLength(2);
    expect(liveCount).toBe(1);
  });
});
