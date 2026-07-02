import * as Sentry from "@sentry/nextjs";
import { scrubEvent, sentryCommonOptions, sentryDsn } from "@/lib/observability";

// Edge runtime Sentry init (middleware, edge routes). Gated on the DSN.
const dsn = sentryDsn();
if (dsn) {
  Sentry.init({
    dsn,
    ...sentryCommonOptions,
    beforeSend: (event) => scrubEvent(event),
  });
}
