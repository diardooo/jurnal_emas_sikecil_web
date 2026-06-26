import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED = [
  "/dashboard",
  "/journal",
  "/growth",
  "/goals",
  "/tasks",
  "/routines",
  "/children",
  "/reports",
  "/settings",
  "/onboarding",
];

export function middleware(req: NextRequest) {
  // Demo mode: with no database configured, skip the auth gate so the app
  // remains fully browsable with mock data.
  if (!process.env.DATABASE_URL) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const sessionCookie = getSessionCookie(req);
  const hasDemoCookie = req.cookies.get("demo")?.value === "1";

  // Real session takes priority — clear any stale demo cookie so the store
  // hydrates with live data instead of mock data.
  if (sessionCookie) {
    const res = NextResponse.next();
    if (hasDemoCookie) {
      res.cookies.set("demo", "", { path: "/", maxAge: 0 });
    }
    return res;
  }

  // Demo mode: read-only sample data, no account needed.
  if (hasDemoCookie) return NextResponse.next();

  const url = new URL("/login", req.url);
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/journal/:path*",
    "/growth/:path*",
    "/goals/:path*",
    "/tasks/:path*",
    "/routines/:path*",
    "/children/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
  ],
};
