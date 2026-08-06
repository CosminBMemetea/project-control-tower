import { setGoalEvidenceUrl } from "@/lib/actions";
import { GOAL_LABELS, type GoalType } from "@/lib/constants";
import { GoalLevelSelect } from "@/components/goal-level-select";
import { ControlledInput } from "@/components/controlled-input";
import { Button } from "@/components/ui/button";

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

      <form
        action={setGoalEvidenceUrl}
        className="flex flex-1 min-w-64 items-center gap-2"
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="goalType" value={goalType} />
        <ControlledInput
          name="evidenceUrl"
          placeholder="Evidence link (optional)"
          defaultValue={evidenceUrl ?? ""}
          className="flex-1"
        />
        <Button type="submit" size="sm" variant="outline">
          Save Evidence
        </Button>
      </form>
    </div>
  );
}
