// Central branding config — the only place app name/description/color/logo
// should be set. Edit the fallback values below directly, or override any
// of them per-deployment with the matching NEXT_PUBLIC_ env var (useful
// when you don't want to touch source, e.g. Docker/Vercel deploys).
//
// These are read by both server and client components (the sidebar needs
// the name too), so every field must be safe to ship to the browser —
// don't put secrets here.

export interface AppConfig {
  name: string;
  shortDescription: string;
  /** Optional hex color (e.g. "#2563eb") to theme the app's primary/accent color. */
  primaryColor?: string;
  /** Optional path or URL to a logo image, shown in the sidebar instead of the generated initial badge. */
  logoUrl?: string;
}

export const APP_CONFIG: AppConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Project Control Tower",
  shortDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Portfolio governance & reporting",
  primaryColor: process.env.NEXT_PUBLIC_APP_PRIMARY_COLOR || undefined,
  logoUrl: process.env.NEXT_PUBLIC_APP_LOGO_URL || undefined,
};
