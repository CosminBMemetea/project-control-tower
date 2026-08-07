"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@config/app";
import { LayoutDashboard, FolderKanban, ShieldCheck, FileText } from "lucide-react";

const NAV_ITEMS = [
  { href: "/portfolio", label: "Portfolio Overview", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/report-template", label: "Report Template", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r bg-muted/30 flex flex-col h-full">
      <div className="px-5 py-5 border-b flex items-center gap-2.5">
        {APP_CONFIG.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external/deployment-provided logo, not a static import
          <img
            src={APP_CONFIG.logoUrl}
            alt=""
            className="size-8 rounded-md object-contain shrink-0"
          />
        ) : (
          <div
            aria-hidden
            className="size-8 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold"
          >
            {APP_CONFIG.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold text-sm tracking-tight truncate">
            {APP_CONFIG.name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {APP_CONFIG.shortDescription}
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
