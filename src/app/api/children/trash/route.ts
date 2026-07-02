import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { children } from "@/db/schema/app";
import { getUser, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Trash (JES-114): the user's soft-deleted children, newest-trashed first, so
 * Settings can offer restore or permanent delete before the 30-day purge.
 */
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const rows = await db
    .select()
    .from(children)
    .where(and(eq(children.userId, user.id), isNotNull(children.deletedAt)))
    .orderBy(desc(children.deletedAt));

  return NextResponse.json(rows);
}
