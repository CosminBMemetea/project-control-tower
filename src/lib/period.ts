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

// Status reports are collected every Monday (1) and Thursday (4).
export function isMondayOrThursday(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 1 || day === 4;
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Most recent Monday or Thursday on/before `date`, used as the default
// value for the "add status report" form.
export function mostRecentReportingDate(date: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  while (!isMondayOrThursday(d)) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return d;
}

