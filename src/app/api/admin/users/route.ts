import { NextRequest, NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { children, subscriptions } from "@/db/schema/app";
import { forbidden, getAdmin } from "@/lib/admin";

/** List every user with child count + current plan. Supports ?q=&plan=&status=. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();

  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") ?? "").toLowerCase();
  const planFilter = sp.get("plan"); // 'premium' | 'free'
  const statusFilter = sp.get("status"); // 'active' | 'suspended'

  const [users, kidRows, subRows] = await Promise.all([
    db.select().from(user).orderBy(desc(user.createdAt)),
    db.select({ userId: children.userId, kids: count(children.id) }).from(children).groupBy(children.userId),
    db.select().from(subscriptions),
  ]);

  const kidsByUser = new Map(kidRows.map((r) => [r.userId, Number(r.kids)]));
  const subByUser = new Map(subRows.map((s) => [s.userId, s]));

  let rows = users.map((u) => {
    const sub = subByUser.get(u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      image: u.image,
      createdAt: u.createdAt,
      kids: kidsByUser.get(u.id) ?? 0,
      plan: sub?.plan ?? "free",
      planStatus: sub?.status ?? null,
      expiresAt: sub?.expiresAt ?? null,
    };
  });

  if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.phone ?? "").includes(q));
  if (planFilter) rows = rows.filter((r) => r.plan === planFilter);
  if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);

  return NextResponse.json(rows);
}

/** Provision a user manually (admin). Reuses Better Auth so the password hashes. */
export async function POST(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { name, email, password, phone, plan } = body as {
    name?: string; email?: string; password?: string; phone?: string; plan?: string;
  };
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
  }

  const { auth } = await import("@/lib/auth");
  let userId: string;
  try {
    const res = await auth.api.signUpEmail({ body: { name, email, password } });
    userId = res.user.id;
  } catch {
    return NextResponse.json({ error: "Email sudah terdaftar atau tidak valid" }, { status: 400 });
  }

  if (phone) await db.update(user).set({ phone }).where(eq(user.id, userId));
  await db.insert(subscriptions).values({
    userId,
    plan: plan === "premium" ? "premium" : "free",
    status: "active",
  });

  return NextResponse.json({ id: userId }, { status: 201 });
}
