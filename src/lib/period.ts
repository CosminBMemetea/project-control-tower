export function currentQuarter(date: Date = new Date()): string {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
}

export function currentMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function isFirstHalfOfMonth(date: Date = new Date()): boolean {
  return date.getDate() <= 15;
}

export function currentReportingPeriod(date: Date = new Date()): string {
  return `${currentMonth(date)}-${isFirstHalfOfMonth(date) ? "mid" : "end"}`;
}

// Weekly status reports are expected every Monday (1) and Thursday (4) —
// used to flag a "Weekly Status" report dated for some other weekday.
export function isMondayOrThursday(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 1 || day === 4;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// --- Locale-stable date formatting (SSR-safe) ---------------------------
// Never use toLocaleDateString() / toLocaleString() for rendered UI text:
// Node and the browser disagree on default locale (e.g. 8/5/2026 vs
// 05/08/2026), which causes React hydration mismatches. These helpers use
// fixed English names and zero-padded numeric forms only.

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const WEEKDAYS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

function asDate(value: Date | string | number): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Stable `YYYY-MM-DD` in UTC — preferred for compact UI dates. */
export function formatDate(value: Date | string | number): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Stable `D MMM YYYY` in UTC, e.g. `5 Aug 2026`. */
export function formatDateDisplay(value: Date | string | number): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Stable `YYYY-MM-DD HH:mm` in UTC. */
export function formatDateTime(value: Date | string | number): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${mm}`;
}

/** Stable `Month YYYY` in UTC, e.g. `August 2026`. */
export function formatMonthYear(value: Date | string | number): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Stable `Wed, 5 Aug 2026` in UTC. */
export function formatWeekdayMonthDay(value: Date | string | number): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${WEEKDAYS_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Stable long local-calendar label, e.g. `Monday, 5 Aug 2026`.
 * Uses local getters — only for Dates built with local methods
 * (e.g. nextOccurrence), not for DB timestamps stored as UTC.
 */
export function formatDateLongLocal(value: Date | string | number): string {
  const d = asDate(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

