import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/constants";
import { isMondayOrThursday } from "@/lib/period";

const MONTH_YEAR = (d: Date) =>
  d.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const WEEKDAY_MONTH_DAY = (d: Date) =>
  d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// One human label per report, combining its type and date. Falls back to
// the custom title when there is one (mainly for CUSTOM reports).
export function reportLabel(
  type: string,
  reportDate: Date,
  title?: string | null
): string {
  if (title) return title;
  switch (type as ReportType) {
    case "MID_MONTH":
      return `Mid-Month — ${MONTH_YEAR(reportDate)}`;
    case "END_MONTH":
      return `End-Month — ${MONTH_YEAR(reportDate)}`;
    case "WEEKLY":
      return `Weekly Status — ${WEEKDAY_MONTH_DAY(reportDate)}`;
    default:
      return `${REPORT_TYPE_LABELS[type as ReportType] ?? type} — ${WEEKDAY_MONTH_DAY(reportDate)}`;
  }
}

// A "Weekly Status" report is expected on a Monday or Thursday — flags
// it when it isn't, same soft-validation nicety the old status-report
// flow had.
export function isOffCadenceWeekly(type: string, reportDate: Date): boolean {
  return type === "WEEKLY" && !isMondayOrThursday(reportDate);
}
