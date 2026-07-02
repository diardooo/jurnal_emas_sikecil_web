import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_BODY = 8 * 1024; // ignore oversized/abusive payloads

/**
 * CSP violation collector (JES-108). Browsers POST here (unauthenticated, per
 * the spec) when the report-only policy is violated. We log a trimmed summary
 * so the policy can be tuned before it is enforced, then return 204. Only three
 * fields are logged — never the whole payload — to avoid log spam/injection.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY) return new NextResponse(null, { status: 204 });

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const r = (parsed["csp-report"] ?? parsed) as Record<string, unknown>;
    console.warn(
      "[csp-report]",
      JSON.stringify({
        documentUri: r["document-uri"],
        violatedDirective: r["violated-directive"] ?? r["effective-directive"],
        blockedUri: r["blocked-uri"],
      }),
    );
  } catch {
    // Malformed report — ignore silently.
  }

  return new NextResponse(null, { status: 204 });
}
