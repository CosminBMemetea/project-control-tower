"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GOAL_SHORT_LABELS } from "@/lib/constants";
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

// Goal-track tabs take their names from config/goals.ts so renaming a
// track there renames its tab too.
const TABS: { slug: string; label: string; icon: LucideIcon }[] = [
  { slug: "environment", label: GOAL_SHORT_LABELS.ENVIRONMENT_SETUP, icon: Settings2 },
  { slug: "health", label: "Health", icon: Radar },
  { slug: "planning", label: GOAL_SHORT_LABELS.PLANNING_TRACKING, icon: ClipboardList },
  { slug: "meetings", label: GOAL_SHORT_LABELS.MEETING_CADENCE, icon: CalendarDays },
  { slug: "risks", label: "Risk Register", icon: ShieldAlert },
  { slug: "reporting", label: GOAL_SHORT_LABELS.PERIODIC_REPORTING, icon: FileText },
  { slug: "checklist", label: GOAL_SHORT_LABELS.REPORTING_CHECKLIST, icon: ListChecks },
  { slug: "monitoring", label: "Monitoring", icon: Activity },
  { slug: "compliance", label: GOAL_SHORT_LABELS.EXECUTION_ASSURANCE, icon: ClipboardCheck },
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
