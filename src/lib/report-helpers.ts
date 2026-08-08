import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/constants";
import {
  formatMonthYear,
  formatWeekdayMonthDay,
  isMondayOrThursday,
} from "@/lib/period";

// One human label per report, combining its type and date. Falls back to
// the custom title when there is one (mainly for CUSTOM reports).
// Uses locale-stable formatters so SSR HTML matches client hydration.
export function reportLabel(
  type: string,
  reportDate: Date,
  title?: string | null
): string {
  if (title) return title;
  switch (type as ReportType) {
    case "MID_MONTH":
      return `Mid-Month — ${formatMonthYear(reportDate)}`;
    case "END_MONTH":
      return `End-Month — ${formatMonthYear(reportDate)}`;
    case "WEEKLY":
      return `Weekly Status — ${formatWeekdayMonthDay(reportDate)}`;
    default:
      return `${REPORT_TYPE_LABELS[type as ReportType] ?? type} — ${formatWeekdayMonthDay(reportDate)}`;
  }
}

// A "Weekly Status" report is expected on a Monday or Thursday — flags
// it when it isn't, same soft-validation nicety the old status-report
// flow had.
export function isOffCadenceWeekly(type: string, reportDate: Date): boolean {
  return type === "WEEKLY" && !isMondayOrThursday(reportDate);
}
