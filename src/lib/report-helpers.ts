import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/constants";
import {
  formatMonthYear,
  formatWeekdayMonthDay,
  isMondayOrThursday,
  weeksAgo,
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

export type WeeklyReportState = "CURRENT" | "STALE" | "MISSING";

// Boils a project's latest Weekly Status report down to a single state
// for the portfolio-wide view: submitted this week, submitted but not
// this week, or never submitted at all.
export function weeklyReportState(
  latestWeekly: { reportDate: Date } | null | undefined,
  now: Date = new Date()
): WeeklyReportState {
  if (!latestWeekly) return "MISSING";
  return weeksAgo(latestWeekly.reportDate, now) === 0 ? "CURRENT" : "STALE";
}

// Report template sections are user-editable free text (Report Template
// page) rather than a fixed enum, so "the Highlights section" has to be
// found by label rather than a stable id. Matches case/whitespace
// loosely since a section might be renamed to "Highlights " or
// "highlights" without that being meant as a different section.
export function findSectionContent(
  report: { sections: { content: string | null; section: { label: string } }[] } | null | undefined,
  label: string
): string | null {
  if (!report) return null;
  const target = label.trim().toLowerCase();
  const entry = report.sections.find(
    (e) => e.section.label.trim().toLowerCase() === target
  );
  return entry?.content?.trim() || null;
}
