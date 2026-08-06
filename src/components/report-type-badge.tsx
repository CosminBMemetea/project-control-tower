import { cn } from "@/lib/utils";
import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/constants";

const REPORT_TYPE_COLORS: Record<ReportType, string> = {
  MID_MONTH: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  END_MONTH: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  WEEKLY: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  CUSTOM: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

export function ReportTypeBadge({ type }: { type: string }) {
  const t = type as ReportType;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap",
        REPORT_TYPE_COLORS[t] ?? REPORT_TYPE_COLORS.CUSTOM
      )}
    >
      {REPORT_TYPE_LABELS[t] ?? type}
    </span>
  );
}
