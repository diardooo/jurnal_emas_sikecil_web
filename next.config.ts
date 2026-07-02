import type { NextConfig } from "next";
import { buildCsp } from "./src/lib/csp";

// Conservative security headers applied to every route. The Content-Security-
// Policy ships in REPORT-ONLY mode first (see src/lib/csp.ts): it never blocks,
// only reports violations to /api/csp-report, so a strict policy can be tuned
// against real traffic before it is enforced (JES-108 → enforce is JES-109).
const securityHeaders = [
  // Force HTTPS for 2 years (ignored on http/localhost). Safe once the prod
  // domain is HTTPS-only, which Vercel is.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Block being framed by other sites (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't let browsers MIME-sniff responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful APIs the app doesn't use.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Report-only CSP — observe first, enforce later.
  { key: "Content-Security-Policy-Report-Only", value: buildCsp() },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // hide "X-Powered-By: Next.js"
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
