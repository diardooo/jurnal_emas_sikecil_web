import { NextRequest, NextResponse } from "next/server";
import { asc, eq, getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { getUser, notFound } from "@/lib/api";

const ADMIN_ROLES = new Set(["admin", "superadmin"]);

export const forbidden = () =>
  NextResponse.json({ error: "Akses admin diperlukan" }, { status: 403 });

/**
 * Resolve the session user and confirm they hold an admin role. Role is read
 * fresh from the DB so a demotion/suspension takes effect immediately.
 */
export async function getAdmin(req: NextRequest) {
  const u = await getUser(req);
  if (!u) return null;
  const [row] = await db
    .select({ role: user.role, status: user.status })
    .from(user)
    .where(eq(user.id, u.id))
    .limit(1);
  if (!row || row.status !== "active" || !ADMIN_ROLES.has(row.role)) return null;
  return { ...u, role: row.role };
}

const PROTECTED = new Set(["id", "createdAt", "updatedAt"]);

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

type AnyTable = PgTable & { id: any; sortOrder?: any; createdAt?: any };

/**
 * Admin-scoped CRUD for a global (non-user-owned) table. Every handler is gated
 * behind {@link getAdmin}. Mirrors `resource()` in lib/api.ts but without the
 * per-user ownership filter.
 */
export function adminResource(table: AnyTable) {
  const cols = getTableColumns(table) as Record<string, unknown>;
  const hasSort = "sortOrder" in cols;
  const hasCreatedAt = "createdAt" in cols;
  const order = hasSort ? asc(table.sortOrder) : hasCreatedAt ? asc(table.createdAt) : asc(table.id);

  async function GET(req: NextRequest) {
    if (!(await getAdmin(req))) return forbidden();
    const rows = await db.select().from(table).orderBy(order);
    return NextResponse.json(rows);
  }

  async function POST(req: NextRequest) {
    if (!(await getAdmin(req))) return forbidden();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const [row] = await db.insert(table).values(sanitize(table, body)).returning();
    return NextResponse.json(row, { status: 201 });
  }

  async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    if (!(await getAdmin(req))) return forbidden();
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const [row] = await db
      .update(table)
      .set(sanitize(table, body))
      .where(eq(table.id, id))
      .returning();
    if (!row) return notFound();
    return NextResponse.json(row);
  }

  async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    if (!(await getAdmin(req))) return forbidden();
    const { id } = await ctx.params;
    const [row] = await db.delete(table).where(eq(table.id, id)).returning();
    if (!row) return notFound();
    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PATCH, DELETE };
}
