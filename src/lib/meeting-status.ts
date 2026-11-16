import {
  WEEKDAYS,
  RECURRENCE_LABELS,
  RECURRENCE_INTERVAL_DAYS,
  MEETING_GRACE_DAYS,
} from "@/lib/constants";

export type MeetingStatus = "ACTIVE" | "MISSING" | "NEEDS_UPDATE";

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  ACTIVE: "Active",
  MISSING: "Missing",
  NEEDS_UPDATE: "Needs update",
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  MISSING: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  NEEDS_UPDATE:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
};

// Stale once a full interval of the meeting's own recurrence plus a grace
// week has passed with no occurrence logged — so a monthly steering
// committee isn't flagged two weeks in. No recurrence set (or Custom)
// counts as weekly: 7 + 7 = the original flat 14-day rule.
export function computeMeetingStatus(
  meeting:
    | { lastOccurredAt: Date | null; recurrenceType?: string | null }
    | null
    | undefined
): MeetingStatus {
  if (!meeting) return "MISSING";
  if (!meeting.lastOccurredAt) return "NEEDS_UPDATE";
  const interval =
    RECURRENCE_INTERVAL_DAYS[
      meeting.recurrenceType as keyof typeof RECURRENCE_INTERVAL_DAYS
    ] ?? RECURRENCE_INTERVAL_DAYS.WEEKLY!;
  const daysSince =
    (Date.now() - meeting.lastOccurredAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > interval + MEETING_GRACE_DAYS ? "NEEDS_UPDATE" : "ACTIVE";
}

// "Weekly", "Every 3 weeks", or the custom free-text label — whatever
// should be shown next to a meeting. Null when no recurrence is set yet.
export function recurrenceDisplay(
  type: string | null | undefined,
  label: string | null | undefined
): string | null {
  if (!type) return null;
  if (type === "CUSTOM") return label || "Custom";
  return RECURRENCE_LABELS[type as keyof typeof RECURRENCE_LABELS] ?? type;
}

const WEEKDAY_INDEX: Record<string, number> = Object.fromEntries(
  WEEKDAYS.map((day, i) => [day, i === 6 ? 0 : i + 1]) // Monday=1 ... Sunday=0, matching Date#getDay()
);

// Next date on/after `from` that falls on `dayOfWeek`. Simple by design:
// assumes a weekly cadence and doesn't know about the meeting's time of
// day, so "today" counts as the next occurrence.
export function nextOccurrence(
  dayOfWeek: string | null | undefined,
  from: Date = new Date()
): Date | null {
  if (!dayOfWeek || !(dayOfWeek in WEEKDAY_INDEX)) return null;
  const target = WEEKDAY_INDEX[dayOfWeek];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (target - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}
