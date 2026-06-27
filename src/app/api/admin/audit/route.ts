import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLog } from "@/db/schema/admin";
import { forbidden, getAdmin } from "@/lib/admin";

/** Most recent admin actions (newest first), for the accountability panel. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const rows = await db
    .select({
      id: adminAuditLog.id,
      actorEmail: adminAuditLog.actorEmail,
      action: adminAuditLog.action,
      summary: adminAuditLog.summary,
      createdAt: adminAuditLog.createdAt,
    })
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(100);
  return NextResponse.json(rows);
}
