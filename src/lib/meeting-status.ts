import { WEEKDAYS } from "@/lib/constants";

export type MeetingStatus = "ACTIVE" | "MISSING" | "NEEDS_UPDATE";

// Single, simple rule for every meeting type: if it hasn't been marked as
// occurred in the last 14 days (or never), it needs attention. Kept as one
// flat threshold on purpose — per-type cadence would be more accurate but
// also more to configure and explain.
const STALE_AFTER_DAYS = 14;

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

export function computeMeetingStatus(
  meeting: { lastOccurredAt: Date | null } | null | undefined
): MeetingStatus {
  if (!meeting) return "MISSING";
  if (!meeting.lastOccurredAt) return "NEEDS_UPDATE";
  const daysSince =
    (Date.now() - meeting.lastOccurredAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > STALE_AFTER_DAYS ? "NEEDS_UPDATE" : "ACTIVE";
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
