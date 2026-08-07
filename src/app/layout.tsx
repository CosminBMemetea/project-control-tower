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

// Simple sRGB luminance check to pick a readable foreground (black/white)
// for whatever primary color a deployment configures — good enough for an
// optional cosmetic override, no need for full WCAG contrast math here.
function readableForeground(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "#ffffff";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0a0a0a" : "#ffffff";
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  const primaryOverrideCss = APP_CONFIG.primaryColor
    ? `:root, .dark { --primary: ${APP_CONFIG.primaryColor}; --primary-foreground: ${readableForeground(APP_CONFIG.primaryColor)}; --sidebar-primary: ${APP_CONFIG.primaryColor}; --sidebar-primary-foreground: ${readableForeground(APP_CONFIG.primaryColor)}; --ring: ${APP_CONFIG.primaryColor}; }`
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
