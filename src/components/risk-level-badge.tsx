import { cn } from "@/lib/utils";
import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, type RiskLevel } from "@/lib/constants";

export function RiskLevelBadge({
  level,
  prefix,
}: {
  level: string;
  prefix?: string;
}) {
  const known = (level in RISK_LEVEL_LABELS ? level : "MEDIUM") as RiskLevel;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        RISK_LEVEL_COLORS[known]
      )}
    >
      {prefix ? `${prefix} ${RISK_LEVEL_LABELS[known]}` : RISK_LEVEL_LABELS[known]}
    </span>
  );
}
