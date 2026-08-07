import { createHash, timingSafeEqual } from "crypto";

// Very simple shared-password protection, suitable for gating an internal
// demo — not a real auth system (no accounts, no sessions beyond a single
// cookie). See proxy.ts (the gate) and app/login for the form that sets
// this cookie.
export const AUTH_COOKIE_NAME = "app_auth";

export function isPasswordProtectionEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Constant-time string compare so a wrong guess can't be timed to leak
// how many leading characters it got right.
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// The cookie stores a hash of the configured password rather than the
// password itself, so it isn't sitting in the browser in plain text.
export function expectedAuthCookieValue(): string | null {
  const password = process.env.APP_PASSWORD;
  return password ? sha256(password) : null;
}

export function isValidAuthCookie(cookieValue: string | undefined): boolean {
  const expected = expectedAuthCookieValue();
  if (!expected) return true; // protection disabled
  if (!cookieValue) return false;
  return safeEqual(cookieValue, expected);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  return safeEqual(candidate, expected);
}
