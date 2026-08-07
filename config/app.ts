// Central branding config — the only place app name/description/color/logo
// should be set. Edit the fallback values below directly, or override any
// of them per-deployment with the matching env var (useful when you don't
// want to touch source, e.g. Docker/Vercel deploys) — see .env.example.
//
// This module is only ever imported by server components (the branding
// values are threaded down to client components like the sidebar via
// props from the root layout), so these can be plain env vars — no
// NEXT_PUBLIC_ prefix, and no need to worry about what ships to the
// browser bundle.

export interface AppConfig {
  name: string;
  shortDescription: string;
  /** Optional hex color (e.g. "#2563eb") to theme the app's primary/accent color. */
  primaryColor?: string;
  /** Optional path or URL to a logo image, shown in the sidebar instead of the generated initial badge. */
  logoUrl?: string;
}

export const APP_CONFIG: AppConfig = {
  name: process.env.APP_NAME || "Project Control Tower",
  shortDescription:
    process.env.APP_DESCRIPTION || "Portfolio governance & reporting",
  primaryColor: process.env.APP_PRIMARY_COLOR || undefined,
  logoUrl: process.env.APP_LOGO_URL || undefined,
};
