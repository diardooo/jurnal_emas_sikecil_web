import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { children, reportShares } from "@/db/schema/app";
import { badRequest, getUser, unauthorized } from "@/lib/api";
import { isPremium, premiumRequired } from "@/lib/plan";

export const runtime = "nodejs";
const SHARE_TTL_DAYS = 30;

/** Create a public, read-only report link for one of the caller's children. */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  if (!(await isPremium(user.id))) {
    return premiumRequired("Bagikan laporan via link khusus Premium. Upgrade ke Emas.");
  }

  const body = (await req.json().catch(() => ({}))) as {
    childId?: string;
    from?: string;
    to?: string;
  };
  const childId = (body.childId ?? "").trim();
  if (!childId) return badRequest("Anak belum dipilih");

  const [child] = await db
    .select({ id: children.id })
    .from(children)
    .where(and(eq(children.id, childId), eq(children.userId, user.id)))
    .limit(1);
  if (!child) return badRequest("Anak tidak valid");

  const expiresAt = new Date(Date.now() + SHARE_TTL_DAYS * 864e5);
  const [row] = await db
    .insert(reportShares)
    .values({
      userId: user.id,
      childId,
      fromDate: body.from || null,
      toDate: body.to || null,
      expiresAt,
    })
    .returning({ id: reportShares.id });

  return NextResponse.json({
    token: row.id,
    url: `${req.nextUrl.origin}/r/${row.id}`,
    expiresAt,
  });
}
