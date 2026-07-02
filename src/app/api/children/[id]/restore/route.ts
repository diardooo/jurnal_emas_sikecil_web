import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { children } from "@/db/schema/app";
import { getUser, notFound, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Restore a soft-deleted child (JES-114): clear `deletedAt` so it — and all its
 * still-intact journals, milestones, growth records — reappears everywhere.
 */
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;

  const [row] = await db
    .update(children)
    .set({ deletedAt: null })
    .where(
      and(
        eq(children.id, id),
        eq(children.userId, user.id),
        isNotNull(children.deletedAt),
      ),
    )
    .returning();

  if (!row) return notFound();
  return NextResponse.json(row);
}
