import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { verifyJwt } from "@/lib/session-token";

// Next.js 16: "proxy" replaces middleware. It checks the signed session cookie before any
// dashboard page loads; every dashboard page and Server Action also re-checks against the database.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (["/admin/login", "/admin/forgot", "/admin/reset"].some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!(await verifyJwt(request.cookies.get(SESSION_COOKIE)?.value ?? ""))) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login/";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
