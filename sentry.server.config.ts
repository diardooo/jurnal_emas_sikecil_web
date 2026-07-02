import * as Sentry from "@sentry/nextjs";
import { scrubEvent, sentryCommonOptions, sentryDsn } from "@/lib/observability";

// Server (Node.js runtime) Sentry init. Gated: no DSN ⇒ no init ⇒ no-op.
const dsn = sentryDsn();
if (dsn) {
  Sentry.init({
    dsn,
    ...sentryCommonOptions,
    beforeSend: (event) => scrubEvent(event),
  });
}
