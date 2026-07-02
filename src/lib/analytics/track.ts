import {
  type AnalyticsEvent,
  type AnalyticsProps,
  buildEventProps,
  isAnalyticsEvent,
} from "./events";

/**
 * Emit a product-analytics event (JES-107). Safe everywhere:
 *  - no-ops on the server (Vercel Analytics is client-side);
 *  - no-ops silently when Analytics isn't active in the Vercel dashboard;
 *  - only REGISTERED events are sent;
 *  - PII / free-text is stripped by `buildEventProps`.
 *
 * The `@vercel/analytics` module is dynamically imported so it never enters the
 * server bundle.
 */
export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (!isAnalyticsEvent(event)) return;
  if (typeof window === "undefined") return; // client-only
  const payload = buildEventProps(props);
  void import("@vercel/analytics")
    .then((m) => m.track(event, payload))
    .catch(() => {
      /* analytics is best-effort — never surface an error to the user */
    });
}
