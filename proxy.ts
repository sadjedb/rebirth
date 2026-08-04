import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mono_session";

export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/admin");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Scoped to /admin only — this has zero effect on the storefront.
export const config = {
  matcher: "/admin/:path*",
};
