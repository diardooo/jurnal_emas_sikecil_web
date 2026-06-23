import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { children } from "@/db/schema/app";
import { forbidden, getAdmin } from "@/lib/admin";

/** Every child profile joined to its parent account. Supports ?userId=&q=. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const sp = req.nextUrl.searchParams;
  const userId = sp.get("userId");
  const q = (sp.get("q") ?? "").toLowerCase();

  const rows = await db
    .select({
      id: children.id,
      name: children.name,
      gender: children.gender,
      dob: children.dob,
      color: children.color,
      birthWeight: children.birthWeight,
      birthHeight: children.birthHeight,
      createdAt: children.createdAt,
      userId: user.id,
      parentName: user.name,
      parentEmail: user.email,
      parentPhone: user.phone,
    })
    .from(children)
    .innerJoin(user, eq(children.userId, user.id))
    .orderBy(desc(children.createdAt));

  let out = rows;
  if (userId) out = out.filter((r) => r.userId === userId);
  if (q) out = out.filter((r) => r.name.toLowerCase().includes(q) || r.parentName.toLowerCase().includes(q));

  return NextResponse.json(out);
}
