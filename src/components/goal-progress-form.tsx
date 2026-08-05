import { upsertGoalProgress } from "@/lib/actions";
import { GOAL_LEVELS, GOAL_LABELS, type GoalType } from "@/lib/constants";
import { GoalBadge } from "@/components/goal-badge";
import { Input } from "@/components/ui/input";
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
    <form
      action={upsertGoalProgress}
      className="flex flex-wrap items-center gap-3"
    >
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="goalType" value={goalType} />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {GOAL_LABELS[goalType]} coverage
        </span>
        <GoalBadge level={level} />
      </div>

      <select
        name="level"
        defaultValue={level}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
      >
        {GOAL_LEVELS.map((l) => (
          <option key={l} value={l}>
            {l}%
          </option>
        ))}
      </select>

      <Input
        name="evidenceUrl"
        placeholder="Evidence link (optional)"
        defaultValue={evidenceUrl ?? ""}
        className="flex-1 min-w-48"
      />

      <Button type="submit" size="sm" variant="outline">
        Save
      </Button>
    </form>
  );
}
