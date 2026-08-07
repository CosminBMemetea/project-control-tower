"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Settings2,
  Radar,
  ClipboardList,
  CalendarDays,
  ShieldAlert,
  FileText,
  ListChecks,
  Activity,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

const TABS: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: "environment", label: "Environment & Rules", icon: Settings2 },
  { slug: "health", label: "Health", icon: Radar },
  { slug: "planning", label: "Planning & Tracking", icon: ClipboardList },
  { slug: "meetings", label: "Meetings & Cadence", icon: CalendarDays },
  { slug: "risks", label: "Risk Register", icon: ShieldAlert },
  { slug: "reporting", label: "Reporting", icon: FileText },
  { slug: "checklist", label: "Checklist", icon: ListChecks },
  { slug: "monitoring", label: "Monitoring", icon: Activity },
  { slug: "compliance", label: "Execution / Compliance", icon: ClipboardCheck },
];

export function ProjectTabs({ code }: { code: string }) {
  const pathname = usePathname();

  return (
    <div className="border-b overflow-x-auto">
      <nav className="flex gap-1 min-w-max">
        {TABS.map((tab) => {
          const href = `/projects/${code}/${tab.slug}`;
          const active = pathname === href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
