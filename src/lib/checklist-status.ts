import { CHECKLIST_VERIFICATION_DAYS } from "@/lib/constants";

export type ChecklistStatus = "ACTIVE" | "MISSING" | "NEEDS_UPDATE";

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  ACTIVE: "Verified recently",
  NEEDS_UPDATE: "Verification overdue",
  MISSING: "Never verified",
};

export const CHECKLIST_STATUS_COLORS: Record<ChecklistStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  NEEDS_UPDATE:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  MISSING: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

// "Project awareness" status: ACTIVE if someone has actually submitted
// answers within the last CHECKLIST_VERIFICATION_DAYS, NEEDS_UPDATE if
// submissions exist but they're all stale, MISSING if nothing was ever
// submitted at all. Only *submitted* responses count — a sent-but-unanswered
// checklist doesn't establish awareness.
export function computeChecklistStatus(
  submissions: { submittedAt: Date | null }[]
): ChecklistStatus {
  const submittedDates = submissions
    .map((s) => s.submittedAt)
    .filter((d): d is Date => d !== null);

  if (submittedDates.length === 0) return "MISSING";

  const mostRecent = new Date(Math.max(...submittedDates.map((d) => d.getTime())));
  const daysSince = (Date.now() - mostRecent.getTime()) / (1000 * 60 * 60 * 24);

  return daysSince > CHECKLIST_VERIFICATION_DAYS ? "NEEDS_UPDATE" : "ACTIVE";
}
