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
