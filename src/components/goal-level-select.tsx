"use client";

import { useState, useTransition } from "react";
import { GOAL_LEVELS, type GoalType } from "@/lib/constants";
import { setGoalLevel } from "@/lib/actions";
import { GoalBadge } from "@/components/goal-badge";

/**
 * The one control that can change a GoalProgress.level. Used from both
 * the Portfolio Overview grid and the per-project goal tabs so there is
 * exactly one save path for "current level" — auto-saves on change via
 * setGoalLevel, no separate Save button to forget.
 */
export function GoalLevelSelect({
  projectId,
  code,
  goalType,
  level: serverLevel,
  layout = "row",
}: {
  projectId: string;
  code: string;
  goalType: GoalType;
  level: number;
  layout?: "row" | "stacked";
}) {
  const [level, setLevel] = useState(serverLevel);
  const [prevServerLevel, setPrevServerLevel] = useState(serverLevel);
  const [isPending, startTransition] = useTransition();

  if (serverLevel !== prevServerLevel) {
    setPrevServerLevel(serverLevel);
    setLevel(serverLevel);
  }

  return (
    <div
      className={
        layout === "stacked"
          ? "flex flex-col items-center gap-1"
          : "flex items-center gap-2"
      }
    >
      <GoalBadge level={level} />
      <select
        aria-label="Coverage level"
        value={level}
        disabled={isPending}
        onChange={(e) => {
          const next = Number(e.target.value);
          setLevel(next);
          startTransition(async () => {
            await setGoalLevel(projectId, code, goalType, next);
          });
        }}
        className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs shadow-xs disabled:opacity-50"
      >
        {GOAL_LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}%
          </option>
        ))}
      </select>
    </div>
  );
}
