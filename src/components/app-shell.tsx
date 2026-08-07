"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import type { AppConfig } from "@config/app";

// The checklist response link goes out by email to people outside the
// team who have no reason to see the internal nav (other projects,
// approvals, report template, ...) — so that one route renders standalone.
// The login page also renders standalone (no nav to show before you're in).
export function AppShell({
  children,
  appConfig,
  passwordProtected,
}: {
  children: React.ReactNode;
  appConfig: AppConfig;
  passwordProtected: boolean;
}) {
  const pathname = usePathname();
  const isPublic =
    pathname?.startsWith("/checklist-response") || pathname === "/login";

  if (isPublic) {
    return <main className="min-h-full w-full">{children}</main>;
  }

  return (
    <>
      <Sidebar appConfig={appConfig} passwordProtected={passwordProtected} />
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </>
  );
}
