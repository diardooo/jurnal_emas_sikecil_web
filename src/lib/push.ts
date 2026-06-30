import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema/app";

/** True when the VAPID keypair is configured (env present). */
export function pushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

let configured = false;
function configure() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
  const priv = process.env.VAPID_PRIVATE_KEY!;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@jurnalemas.com";
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  /** Path to open on click (e.g. "/catatan"). */
  url?: string;
  /** Dedupe key — a new push with the same tag replaces the old one. */
  tag?: string;
}

/**
 * Send a notification to every device a user has subscribed. Dead subscriptions
 * (404/410 from the push service) are pruned so we stop trying them.
 */
export async function sendToUser(userId: string, payload: PushPayload) {
  if (!pushConfigured()) return { sent: 0, removed: 0 };
  configure();

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  let sent = 0;
  let removed = 0;
  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, s.id));
          removed++;
        }
      }
    }),
  );

  return { sent, removed };
}
