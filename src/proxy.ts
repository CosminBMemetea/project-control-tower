import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isValidAuthCookie, isPasswordProtectionEnabled } from "@/lib/auth";

// Gates the whole app behind a single shared password when APP_PASSWORD is
// set (see src/lib/auth.ts). When it's unset, this is a no-op and the app
// stays fully open. Note: this file is "proxy.ts", not "middleware.ts" —
// Next.js 16 renamed the convention (middleware.ts still loads but is
// deprecated).
export function proxy(request: NextRequest) {
  if (!isPasswordProtectionEnabled()) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (isValidAuthCookie(cookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Everything except: Next internals, the login/logout routes
    // themselves (must stay reachable while logged out), and the public
    // token-secured checklist response link (meant for external
    // recipients who don't have the app password — see README).
    "/((?!_next/static|_next/image|favicon.ico|login|logout|checklist-response).*)",
  ],
};
