import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { subscriptions } from "@/db/schema/app";
import { notFound } from "@/lib/api";
import { forbidden, getAdmin } from "@/lib/admin";
import { logAdmin } from "@/lib/admin-audit";

const EDITABLE = ["name", "email", "phone", "role", "status"] as const;

/** Edit a user (name/email/phone/role/status) and optionally their plan. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req);
  if (!admin) return forbidden();
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  const changed: string[] = [];
  for (const key of EDITABLE) {
    if (key in body && body[key] !== undefined) {
      patch[key] = body[key];
      changed.push(key);
    }
  }

  const [row] = await db.update(user).set(patch).where(eq(user.id, id)).returning();
  if (!row) return notFound();

  // Plan change is mirrored into the subscriptions table.
  if (typeof body.plan === "string") {
    const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, id)).limit(1);
    if (existing) {
      await db.update(subscriptions).set({ plan: body.plan }).where(eq(subscriptions.userId, id));
    } else {
      await db.insert(subscriptions).values({ userId: id, plan: body.plan, status: "active" });
    }
    changed.push(`plan→${body.plan}`);
  }

  if (changed.length) {
    await logAdmin(admin, {
      action: "user.update",
      targetType: "user",
      targetId: id,
      summary: `Ubah user ${row.email}: ${changed.join(", ")}`,
      meta: { changed },
    });
  }

  return NextResponse.json({
    id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, status: row.status,
  });
}

/** Permanently remove a user (cascades to all their data). */
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin(req);
  if (!admin) return forbidden();
  const { id } = await ctx.params;
  if (admin.id === id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }
  const [target] = await db.select({ role: user.role, email: user.email }).from(user).where(eq(user.id, id)).limit(1);
  if (!target) return notFound();
  if (target.role === "superadmin") {
    return NextResponse.json({ error: "Tidak bisa menghapus akun superadmin" }, { status: 400 });
  }
  await db.delete(user).where(eq(user.id, id));
  await logAdmin(admin, {
    action: "user.delete",
    targetType: "user",
    targetId: id,
    summary: `Hapus user ${target.email}`,
  });
  return NextResponse.json({ ok: true });
}
