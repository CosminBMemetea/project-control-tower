import nodemailer from "nodemailer";
import { headers } from "next/headers";
import { APP_CONFIG } from "@config/app";

// Generic SMTP so this works with whatever mail relay is available
// (Office 365, Gmail, an internal relay) — nothing vendor-specific.
// Without SMTP_HOST configured, sends are skipped but never fail loudly:
// the checklist is still created and its link can be copied and shared
// by hand.
function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

// Prefers an explicitly configured APP_BASE_URL (needed once this is
// deployed somewhere with a domain), but falls back to the host that
// actually served the current request — so links are correct out of the
// box in local dev without any setup, on whatever port it happens to run.
export async function getAppBaseUrl(): Promise<string> {
  if (process.env.APP_BASE_URL) {
    return process.env.APP_BASE_URL.replace(/\/$/, "");
  }
  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() isn't available outside a request context
  }
  return "http://localhost:3000";
}

export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: string };

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      sent: false,
      reason:
        "No SMTP server configured (set SMTP_HOST in .env) — share the link manually instead.",
    };
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `${APP_CONFIG.name} <noreply@localhost>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}
