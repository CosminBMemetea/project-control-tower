import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { APP_CONFIG } from "@config/app";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.shortDescription,
};

// Accepts "#fff", "fff", "#2563eb", or "2563eb" and normalizes to
// "#rrggbb" — deployers reasonably type any of these. Returns null for
// anything else (a CSS color name, rgb(), ...), which the caller still
// passes through to CSS as-is, just without a computed contrast color.
function normalizeHex(input: string): string | null {
  const clean = input.replace("#", "").trim();
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return `#${clean}`;
  }
  return null;
}

// Simple sRGB luminance check to pick a readable foreground (black/white)
// for whatever primary color a deployment configures — good enough for an
// optional cosmetic override, no need for full WCAG contrast math here.
function readableForeground(hex: string): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return "#ffffff";
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0a0a0a" : "#ffffff";
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const primaryColor = APP_CONFIG.primaryColor
    ? (normalizeHex(APP_CONFIG.primaryColor) ?? APP_CONFIG.primaryColor)
    : null;
  const primaryOverrideCss = primaryColor
    ? `:root, .dark { --primary: ${primaryColor}; --primary-foreground: ${readableForeground(primaryColor)}; --sidebar-primary: ${primaryColor}; --sidebar-primary-foreground: ${readableForeground(primaryColor)}; --ring: ${primaryColor}; }`
    : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full h-full flex">
        {primaryOverrideCss && <style>{primaryOverrideCss}</style>}
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}
