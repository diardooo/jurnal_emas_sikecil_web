import { NextRequest, NextResponse } from "next/server";
import { getUser, unauthorized, badRequest } from "@/lib/api";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema/app";

/** Save (or refresh) the calling browser's Web Push subscription. */
export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as {
    subscription?: {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };
  };
  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return badRequest("Data langganan tidak lengkap");
  }

  const userAgent = req.headers.get("user-agent")?.slice(0, 300) ?? null;

  // Endpoint is unique per device; a device may re-subscribe (keys rotate) or
  // switch accounts, so upsert on endpoint.
  await db
    .insert(pushSubscriptions)
    .values({ userId: user.id, endpoint, p256dh, auth, userAgent })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: user.id, p256dh, auth, userAgent },
    });

  return NextResponse.json({ ok: true });
}
