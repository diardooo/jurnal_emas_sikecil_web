import { NextRequest, NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { forbidden, getAdmin } from "@/lib/admin";

/** Bulk action over selected users: suspend | activate | delete. */
export async function POST(req: NextRequest) {
  const admin = await getAdmin(req);
  if (!admin) return forbidden();

  const body = (await req.json().catch(() => ({}))) as { ids?: string[]; action?: string };
  const ids = (body.ids ?? []).filter((x) => x !== admin.id); // never act on self
  if (ids.length === 0) return NextResponse.json({ error: "Tidak ada user dipilih" }, { status: 400 });

  switch (body.action) {
    case "suspend":
      await db.update(user).set({ status: "suspended", updatedAt: new Date() }).where(inArray(user.id, ids));
      break;
    case "activate":
      await db.update(user).set({ status: "active", updatedAt: new Date() }).where(inArray(user.id, ids));
      break;
    case "delete":
      await db.delete(user).where(inArray(user.id, ids));
      break;
    default:
      return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, affected: ids.length });
}
