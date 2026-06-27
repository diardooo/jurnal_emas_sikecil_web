/**
 * Append a row to the admin audit trail. Best-effort: a logging failure must
 * never break the action being audited, so errors are swallowed (logged to the
 * server console only).
 */
import { db } from "@/db";
import { adminAuditLog } from "@/db/schema/admin";

type Actor = { id: string; email: string };

export async function logAdmin(
  actor: Actor,
  entry: {
    action: string;
    summary: string;
    targetType?: string;
    targetId?: string | null;
    meta?: unknown;
  },
): Promise<void> {
  try {
    await db.insert(adminAuditLog).values({
      actorId: actor.id,
      actorEmail: actor.email,
      action: entry.action,
      targetType: entry.targetType ?? null,
      targetId: entry.targetId ?? null,
      summary: entry.summary,
      meta: (entry.meta as Record<string, unknown>) ?? null,
    });
  } catch (e) {
    console.error("[audit] gagal mencatat aksi admin:", e);
  }
}
