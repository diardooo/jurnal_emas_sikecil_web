import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { rolePermissions } from "@/db/schema/admin";
import { forbidden, getAdmin } from "@/lib/admin";
import { logAdmin } from "@/lib/admin-audit";

/** The Free/Premium feature-access matrix. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const rows = await db.select().from(rolePermissions).orderBy(asc(rolePermissions.sortOrder));
  return NextResponse.json(rows);
}

/** Persist toggled rows: body = [{ id, freeEnabled, premiumEnabled }, ...]. */
export async function PUT(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return forbidden();
  const body = (await req.json().catch(() => [])) as Array<{
    id: string; freeEnabled?: boolean; premiumEnabled?: boolean;
  }>;
  if (!Array.isArray(body)) return NextResponse.json({ error: "Format tidak valid" }, { status: 400 });

  await Promise.all(
    body.map((r) =>
      db
        .update(rolePermissions)
        .set({
          ...(typeof r.freeEnabled === "boolean" ? { freeEnabled: r.freeEnabled } : {}),
          ...(typeof r.premiumEnabled === "boolean" ? { premiumEnabled: r.premiumEnabled } : {}),
        })
        .where(eq(rolePermissions.id, r.id)),
    ),
  );

  const rows = await db.select().from(rolePermissions).orderBy(asc(rolePermissions.sortOrder));
  await logAdmin(admin, {
    action: "roles.update",
    targetType: "roles",
    summary: `Ubah matriks akses fitur (${body.length} baris)`,
    meta: { rows: body.length },
  });
  return NextResponse.json(rows);
}
