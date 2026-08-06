import { cn } from "@/lib/utils";
import {
  CHECKLIST_STATUS_COLORS,
  CHECKLIST_STATUS_LABELS,
  type ChecklistStatus,
} from "@/lib/checklist-status";

export function ChecklistStatusBadge({ status }: { status: ChecklistStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        CHECKLIST_STATUS_COLORS[status]
      )}
    >
      {CHECKLIST_STATUS_LABELS[status]}
    </span>
  );
}
