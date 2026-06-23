import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { children } from "@/db/schema/app";

/** Resolve the authenticated user for a route handler, or null. */
export async function getUser(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  return session?.user ?? null;
}

export const unauthorized = () =>
  NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

export const badRequest = (message: string) =>
  NextResponse.json({ error: message }, { status: 400 });

export const notFound = () =>
  NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

const PROTECTED = new Set(["id", "userId", "createdAt"]);

/** Whitelist only real, writable columns from an arbitrary JSON body. */
function sanitize(table: PgTable, body: Record<string, unknown>) {
  const cols = getTableColumns(table) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(cols)) {
    if (PROTECTED.has(key)) continue;
    if (key in body && body[key] !== undefined) out[key] = body[key];
  }
  return out;
}

type AnyTable = PgTable & {
  id: any;
  userId: any;
  childId?: any;
  createdAt?: any;
};

async function ownsChild(userId: string, childId: string) {
  const rows = await db
    .select({ id: children.id })
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

/**
 * Build collection (GET list, POST create) + item (PATCH, DELETE) handlers for
 * a user-owned table. Every query is scoped to the session user.
 */
export function resource(table: AnyTable) {
  const cols = getTableColumns(table) as Record<string, unknown>;
  const hasChild = "childId" in cols;
  const hasCreatedAt = "createdAt" in cols;

  async function GET(req: NextRequest) {
    const userInfo = await getUser(req);
    if (!userInfo) return unauthorized();
    const childId = req.nextUrl.searchParams.get("childId");
    const filters = [eq(table.userId, userInfo.id)];
    if (hasChild && childId) filters.push(eq(table.childId, childId));
    const rows = await db
      .select()
      .from(table)
      .where(and(...filters))
      .orderBy(hasCreatedAt ? asc(table.createdAt) : asc(table.id));
    return NextResponse.json(rows);
  }

  async function POST(req: NextRequest) {
    const userInfo = await getUser(req);
    if (!userInfo) return unauthorized();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const data = sanitize(table, body);
    if (hasChild && data.childId) {
      const ok = await ownsChild(userInfo.id, data.childId as string);
      if (!ok) return badRequest("Anak tidak valid");
    }
    const [row] = await db
      .insert(table)
      .values({ ...data, userId: userInfo.id })
      .returning();
    return NextResponse.json(row, { status: 201 });
  }

  async function PATCH(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ) {
    const userInfo = await getUser(req);
    if (!userInfo) return unauthorized();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const data = sanitize(table, body);
    const [row] = await db
      .update(table)
      .set(data)
      .where(and(eq(table.id, id), eq(table.userId, userInfo.id)))
      .returning();
    if (!row) return notFound();
    return NextResponse.json(row);
  }

  async function DELETE(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
  ) {
    const userInfo = await getUser(req);
    if (!userInfo) return unauthorized();
    const { id } = await ctx.params;
    const [row] = await db
      .delete(table)
      .where(and(eq(table.id, id), eq(table.userId, userInfo.id)))
      .returning();
    if (!row) return notFound();
    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PATCH, DELETE };
}
