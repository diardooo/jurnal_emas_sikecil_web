/**
 * Content Security Policy (JES-108). Shipped in REPORT-ONLY mode first: it never
 * blocks, it only reports violations to {@link CSP_REPORT_PATH}, so we can watch
 * what a strict policy would break before enforcing it. The enforce flip (with a
 * per-request nonce for the inline hydration + JSON-LD scripts) is a deliberate
 * follow-up (JES-109), gated on a clean soak.
 *
 * Notes on the current allowances (to tighten at enforce time):
 *  - `script-src` keeps 'unsafe-inline'/'unsafe-eval' — Next's hydration bootstrap
 *    and the landing-page JSON-LD <script> are inline; enforce replaces these with
 *    a nonce.
 *  - `style-src` keeps 'unsafe-inline' — Tailwind/Next inject inline styles.
 *  - `img-src` mirrors the remote hosts already allow-listed in next.config images.
 *  - Gemini / Cloudinary-upload / Midtrans-status calls happen server-side, so the
 *    browser only talks to 'self' (/api/*) for those — no connect-src entry needed.
 */
export const CSP_REPORT_PATH = "/api/csp-report";

const DIRECTIVES: Record<string, string[]> = {
  "default-src": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "frame-ancestors": ["'self'"],
  "form-action": ["'self'"],
  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://images.unsplash.com",
    "https://api.dicebear.com",
    "https://lh3.googleusercontent.com",
  ],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://va.vercel-scripts.com"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'", "https://va.vercel-scripts.com", "https://vitals.vercel-insights.com"],
  "frame-src": ["'self'", "https://app.midtrans.com", "https://app.sandbox.midtrans.com"],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
};

/** Build the CSP header value (report-only variant appends the report endpoint). */
export function buildCsp(): string {
  const body = Object.entries(DIRECTIVES)
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
  return `${body}; report-uri ${CSP_REPORT_PATH}`;
}
