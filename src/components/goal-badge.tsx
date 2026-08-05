import { cn } from "@/lib/utils";
import { GOAL_LEVEL_COLORS } from "@/lib/constants";

export function GoalBadge({ level }: { level: number }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
        GOAL_LEVEL_COLORS[level] ?? GOAL_LEVEL_COLORS[0]
      )}
    >
      {level}%
    </span>
  );
}
