import { NextRequest, NextResponse } from "next/server";
import { and, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { children } from "@/db/schema/app";
import { purgeCutoff } from "@/lib/retention";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Bounded purge (JES-114). Vercel Cron hits this daily (with `Authorization:
 * Bearer $CRON_SECRET`); any child that has sat in Trash past the retention
 * window is hard-deleted, its journals/milestones/growth going with it via FK
 * cascade. Live children (deletedAt IS NULL) are never touched.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const key = req.nextUrl.searchParams.get("key");
  if (secret && authHeader !== `Bearer ${secret}` && key !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 401 });
  }

  const cutoff = purgeCutoff();
  const purged = await db
    .delete(children)
    .where(and(isNotNull(children.deletedAt), lt(children.deletedAt, cutoff)))
    .returning({ id: children.id });

  return NextResponse.json({ cutoff: cutoff.toISOString(), purged: purged.length });
}
