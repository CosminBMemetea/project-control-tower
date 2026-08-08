import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, isValidAuthCookie } from "@/lib/auth";

// Every mutating Server Action in src/lib/actions.ts calls this first.
// Proxy (src/proxy.ts) already redirects unauthenticated *page* loads to
// /login, but it deliberately lets Server Action requests (identified by
// the `next-action` header) through unchecked — redirecting those at the
// HTTP layer breaks the Server Actions client protocol ("An unexpected
// response was received from the server") and crashes the page instead
// of failing cleanly. This is the real auth check for mutations; calling
// redirect() from inside an action (rather than from Proxy) is the
// Next.js-supported way to bail out of one — same mechanism the login
// action itself already uses on success.
export async function requireAuth(): Promise<void> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!isValidAuthCookie(cookie)) {
    redirect("/login");
  }
}
