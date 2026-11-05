import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-cookie";
import { verifyJwt } from "@/lib/session-token";
import { blogPathExists } from "@/lib/posts";

// Next.js 16: "proxy" replaces middleware. It checks the signed session cookie before any
// dashboard page loads; every dashboard page and Server Action also re-checks against the database.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Blog pages stream, so a draft, a missing post, or the blog before any post is live is answered
  // here with a real 404 status (the same approach as the PT with V guides).
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    const blog = /^\/blog(?:\/([^/]+))?\/?$/.exec(pathname);
    const slug = blog?.[1] ? safeDecode(blog[1]) : null;
    return blog && slug !== undefined && (await blogPathExists(slug))
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/page-not-found/", request.url));
  }
  // Everything else this proxy sees is the dashboard or a draft preview (/preview/...): signed in only.
  if (["/admin/login", "/admin/forgot", "/admin/reset"].some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (!(await verifyJwt(request.cookies.get(SESSION_COOKIE)?.value ?? ""))) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login/";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*", "/blog", "/blog/:path*", "/preview/:path*"] };

/** A malformed address (e.g. /blog/%E0) is a missing page, not a crash. */
function safeDecode(s: string): string | undefined {
  try {
    return decodeURIComponent(s);
  } catch {
    return undefined;
  }
}
