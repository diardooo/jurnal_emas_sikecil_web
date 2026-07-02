import * as Sentry from "@sentry/nextjs";
import { scrubEvent, sentryCommonOptions, sentryDsn } from "@/lib/observability";

// Browser Sentry init. Next loads this automatically on the client. Gated on the
// DSN, so with none set the SDK never starts and the bundle stays inert.
const dsn = sentryDsn();
if (dsn) {
  Sentry.init({
    dsn,
    ...sentryCommonOptions,
    beforeSend: (event) => scrubEvent(event),
  });
}

// Lets Sentry tie client-side route changes to navigation traces.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
