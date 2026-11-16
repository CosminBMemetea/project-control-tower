import { cn } from "@/lib/utils";
import { GOAL_LEVELS, GOAL_LEVEL_COLORS } from "@/lib/constants";

export function GoalBadge({ level }: { level: number }) {
  // Averages land between levels (e.g. 37%), so color by the highest level
  // actually reached rather than requiring an exact match.
  const reached = [...GOAL_LEVELS].reverse().find((l) => level >= l) ?? 0;
  return (
    <span
      className={cn(
        "inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
        GOAL_LEVEL_COLORS[reached]
      )}
    >
      {level}%
    </span>
  );
}
