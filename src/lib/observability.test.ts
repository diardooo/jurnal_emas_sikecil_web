import { afterEach, describe, expect, it } from "vitest";
import { scrubEvent, sentryEnabled } from "@/lib/observability";

describe("sentryEnabled (JES-106)", () => {
  const origPublic = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const origServer = process.env.SENTRY_DSN;
  afterEach(() => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = origPublic;
    process.env.SENTRY_DSN = origServer;
  });

  it("is disabled when no DSN is set", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    expect(sentryEnabled()).toBe(false);
  });

  it("is enabled when either DSN var is set", () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    process.env.SENTRY_DSN = "https://abc@o1.ingest.sentry.io/1";
    expect(sentryEnabled()).toBe(true);
  });
});

describe("scrubEvent — never leaks PII / free-text", () => {
  it("drops request cookies, body, query and auth headers", () => {
    const scrubbed = scrubEvent({
      request: {
        cookies: { session: "secret" },
        data: { body: "isi jurnal rahasia" },
        query_string: "token=abc",
        headers: { authorization: "Bearer x", Cookie: "y", "user-agent": "UA" },
      },
    });
    expect(scrubbed.request!.cookies).toBeUndefined();
    expect(scrubbed.request!.data).toBeUndefined();
    expect(scrubbed.request!.query_string).toBeUndefined();
    expect(scrubbed.request!.headers).toEqual({ "user-agent": "UA" });
  });

  it("drops user contact fields but leaves the event otherwise intact", () => {
    const scrubbed = scrubEvent({
      user: { id: "u1", email: "a@b.com", username: "kyara", ip_address: "1.2.3.4" },
      extra: { plan: "free", name: "Kyara", question: "apakah..." },
    });
    expect(scrubbed.user).toEqual({ id: "u1" });
    expect(scrubbed.extra).toEqual({ plan: "free" }); // name/question stripped
  });

  it("tolerates an event with no request / user / extra", () => {
    expect(scrubEvent({})).toEqual({});
  });
});
