import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const TONE_CLASSES = {
  neutral: "text-foreground",
  good: "text-emerald-600 dark:text-emerald-400",
  watch: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
} as const;

// A single "at a glance" number tile — used at the top of the Portfolio
// Overview so the most decision-relevant counts (red projects, open
// risks, ...) don't require scrolling through every table to find.
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-center gap-3">
        <div className={cn("rounded-md bg-muted p-2 shrink-0", TONE_CLASSES[tone])}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className={cn("text-xl font-semibold tabular-nums leading-none", TONE_CLASSES[tone])}>
            {value}
          </div>
          <div className="text-xs text-muted-foreground truncate mt-1">
            {label}
            {sub ? ` · ${sub}` : ""}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
