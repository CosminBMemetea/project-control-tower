"use client";

import { setGoalEvidenceUrl } from "@/lib/actions";
import { GOAL_LABELS, type GoalType } from "@/lib/constants";
import { GoalLevelSelect } from "@/components/goal-level-select";
import { AutosaveInput } from "@/components/autosave-text-field";

export function GoalProgressForm({
  projectId,
  code,
  goalType,
  level,
  evidenceUrl,
}: {
  projectId: string;
  code: string;
  goalType: GoalType;
  level: number;
  evidenceUrl: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">
        {GOAL_LABELS[goalType]} coverage
      </span>

      <GoalLevelSelect
        projectId={projectId}
        code={code}
        goalType={goalType}
        level={level}
      />

      <AutosaveInput
        placeholder="Evidence link (optional)"
        value={evidenceUrl ?? ""}
        className="flex-1 min-w-64"
        aria-label={`${GOAL_LABELS[goalType]} evidence link`}
        onSave={(next) => setGoalEvidenceUrl(projectId, code, goalType, next)}
      />
    </div>
  );
}
