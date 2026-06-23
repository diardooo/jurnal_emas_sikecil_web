import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { notifications, subscriptions } from "@/db/schema/app";
import { forbidden, getAdmin } from "@/lib/admin";

/**
 * Fan out an in-app notification to a target audience. Returns the recipients'
 * phone numbers too, so the dashboard can also open WhatsApp deep-links.
 *
 * body: { title, body, type?, target: 'all'|'free'|'premium'|'ids', ids?: [] }
 */
export async function POST(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const b = (await req.json().catch(() => ({}))) as {
    title?: string; body?: string; type?: string;
    target?: "all" | "free" | "premium" | "ids"; ids?: string[];
  };

  if (!b.title || !b.body) {
    return NextResponse.json({ error: "Judul dan isi pesan wajib diisi" }, { status: 400 });
  }

  // Resolve recipient user ids.
  let recipientIds: string[];
  if (b.target === "ids") {
    recipientIds = b.ids ?? [];
  } else if (b.target === "premium" || b.target === "free") {
    const subs = await db
      .select({ userId: subscriptions.userId })
      .from(subscriptions)
      .where(eq(subscriptions.plan, b.target));
    recipientIds = subs.map((s) => s.userId);
  } else {
    const all = await db.select({ id: user.id }).from(user).where(eq(user.status, "active"));
    recipientIds = all.map((u) => u.id);
  }

  if (recipientIds.length === 0) {
    return NextResponse.json({ error: "Tidak ada penerima" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  await db.insert(notifications).values(
    recipientIds.map((userId) => ({
      userId,
      type: b.type ?? "broadcast",
      title: b.title!,
      body: b.body!,
      date: today,
      read: false,
    })),
  );

  const recipients = await db
    .select({ id: user.id, name: user.name, phone: user.phone })
    .from(user)
    .where(inArray(user.id, recipientIds));

  return NextResponse.json({ ok: true, sent: recipientIds.length, recipients });
}
