"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAME, checkPassword, expectedAuthCookieValue } from "@/lib/auth";
import type { ActionResult } from "@/lib/actions";

export async function login(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const fromRaw = String(formData.get("from") ?? "/");
  // Only ever redirect back within this app — an absolute/external "from"
  // value could otherwise be used to bounce a logged-in user off-site.
  const from = fromRaw.startsWith("/") && !fromRaw.startsWith("//") ? fromRaw : "/";

  if (!checkPassword(password)) {
    return { error: "Incorrect password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, expectedAuthCookieValue()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(from);
}
