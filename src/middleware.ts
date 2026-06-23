import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PROTECTED = [
  "/dashboard",
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

  // Demo mode: read-only sample data, no account needed.
  if (req.cookies.get("demo")?.value === "1") return NextResponse.next();

  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie) {
    const url = new URL("/login", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
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
