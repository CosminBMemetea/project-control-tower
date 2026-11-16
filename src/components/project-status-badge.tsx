import {
  PROJECT_STATUSES,
  PROJECT_STATUS_DESCRIPTIONS,
  PROJECT_STATUS_EMOJI,
  PROJECT_STATUS_LABELS,
  toProjectStatus,
} from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function ProjectStatusBadge({ status }: { status: string }) {
  const s = toProjectStatus(status);
  return (
    <Badge variant="secondary" title={PROJECT_STATUS_DESCRIPTIONS[s]}>
      <span aria-hidden>{PROJECT_STATUS_EMOJI[s]}</span>
      {PROJECT_STATUS_LABELS[s]}
    </Badge>
  );
}

// "🚀 4 Ongoing · ⏸️ 1 On Hold · 🧊 2 Closed" — only statuses that
// actually have projects, in lifecycle order.
export function ProjectStatusSummary({
  projects,
}: {
  projects: { status: string }[];
}) {
  const counts = PROJECT_STATUSES.map((s) => ({
    status: s,
    count: projects.filter((p) => toProjectStatus(p.status) === s).length,
  })).filter((c) => c.count > 0);

  return (
    <span>
      {counts
        .map(
          ({ status, count }) =>
            `${PROJECT_STATUS_EMOJI[status]} ${count} ${PROJECT_STATUS_LABELS[status]}`
        )
        .join(" · ")}
    </span>
  );
}
