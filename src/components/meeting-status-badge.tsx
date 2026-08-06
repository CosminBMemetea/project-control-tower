import { cn } from "@/lib/utils";
import {
  MEETING_STATUS_COLORS,
  MEETING_STATUS_LABELS,
  type MeetingStatus,
} from "@/lib/meeting-status";

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        MEETING_STATUS_COLORS[status]
      )}
    >
      {MEETING_STATUS_LABELS[status]}
    </span>
  );
}
