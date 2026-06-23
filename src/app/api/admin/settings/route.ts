import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { platformSettings } from "@/db/schema/admin";
import { forbidden, getAdmin } from "@/lib/admin";

/** All platform settings as a flat key→value map. */
export async function GET(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const rows = await db.select().from(platformSettings);
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

/** Upsert a partial map of settings: body = { key: value, ... }. */
export async function PUT(req: NextRequest) {
  if (!(await getAdmin(req))) return forbidden();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const entries = Object.entries(body).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });

  await Promise.all(
    entries.map(([key, value]) =>
      db
        .insert(platformSettings)
        .values({ key, value: String(value), updatedAt: new Date() })
        .onConflictDoUpdate({
          target: platformSettings.key,
          set: { value: String(value), updatedAt: new Date() },
        }),
    ),
  );

  const rows = await db.select().from(platformSettings);
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}
