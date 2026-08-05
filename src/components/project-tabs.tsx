"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "environment", label: "Environment & Rules" },
  { slug: "planning", label: "Planning & Tracking" },
  { slug: "meetings", label: "Meetings & Cadence" },
  { slug: "reporting", label: "Reporting" },
  { slug: "checklist", label: "Checklist" },
  { slug: "compliance", label: "Execution / Compliance" },
];

export function ProjectTabs({ code }: { code: string }) {
  const pathname = usePathname();

  return (
    <div className="border-b overflow-x-auto">
      <nav className="flex gap-1 min-w-max">
        {TABS.map((tab) => {
          const href = `/projects/${code}/${tab.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                "px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
