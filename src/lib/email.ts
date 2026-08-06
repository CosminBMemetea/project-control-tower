import nodemailer from "nodemailer";

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

export function getAppBaseUrl(): string {
  return (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
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
      from: process.env.SMTP_FROM ?? "R&I Control Tower <noreply@localhost>",
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
