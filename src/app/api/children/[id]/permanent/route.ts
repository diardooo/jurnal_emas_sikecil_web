import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { children } from "@/db/schema/app";
import { getUser, notFound, unauthorized } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Permanent delete from Trash (JES-114): hard-delete a child the user has already
 * soft-deleted. Only trashed rows qualify (isNotNull deletedAt) so a live child
 * can never be destroyed by this route — that always goes through Trash first.
 * FK cascade wipes the child's journals, milestones, growth, etc.
 */
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const { id } = await ctx.params;

  const [row] = await db
    .delete(children)
    .where(
      and(
        eq(children.id, id),
        eq(children.userId, user.id),
        isNotNull(children.deletedAt),
      ),
    )
    .returning();

  if (!row) return notFound();
  return NextResponse.json({ ok: true });
}
