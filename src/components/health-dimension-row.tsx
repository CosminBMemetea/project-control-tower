"use client";

import { useState, useTransition } from "react";
import {
  HEALTH_SCORES,
  HEALTH_SCORE_LABELS,
  HEALTH_DIMENSION_LABELS,
  type HealthDimension,
} from "@/lib/constants";
import { setHealthComment, setHealthScore } from "@/lib/actions";
import { ControlledInput } from "@/components/controlled-input";
import { ActionForm } from "@/components/action-form";
import { Button } from "@/components/ui/button";

// Score auto-saves the moment the dropdown changes (same pattern as
// GoalLevelSelect / RagStatusControl); the comment is a separate save so
// editing one can never clobber an in-flight change to the other. The
// <select> must live OUTSIDE the comment <form> (a sibling, not a
// descendant) — React resets a form's native form-associated elements
// after an action completes, which would snap an in-form <select> back
// to its first <option> (score 1, "Critical") every time the comment is
// saved, since nothing marks a different one as the DOM's own default.
export function HealthDimensionRow({
  projectId,
  code,
  dimension,
  score: serverScore,
  comment,
}: {
  projectId: string;
  code: string;
  dimension: HealthDimension;
  score: number;
  comment: string | null;
}) {
  const [score, setScore] = useState(serverScore);
  const [prevServerScore, setPrevServerScore] = useState(serverScore);
  const [isPending, startTransition] = useTransition();

  if (serverScore !== prevServerScore) {
    setPrevServerScore(serverScore);
    setScore(serverScore);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0">
      <span className="w-24 shrink-0 text-sm font-medium">
        {HEALTH_DIMENSION_LABELS[dimension]}
      </span>
      <select
        aria-label={`${HEALTH_DIMENSION_LABELS[dimension]} score`}
        value={score}
        disabled={isPending}
        onChange={(e) => {
          const next = Number(e.target.value);
          setScore(next);
          startTransition(async () => {
            await setHealthScore(projectId, code, dimension, next);
          });
        }}
        className="h-8 w-36 shrink-0 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs disabled:opacity-50"
      >
        {HEALTH_SCORES.map((s) => (
          <option key={s} value={s}>
            {s} – {HEALTH_SCORE_LABELS[s]}
          </option>
        ))}
      </select>
      <ActionForm action={setHealthComment} className="flex flex-1 min-w-40 items-center gap-3">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="dimension" value={dimension} />
        <ControlledInput
          name="comment"
          placeholder="Optional note explaining the score"
          defaultValue={comment ?? ""}
          maxLength={200}
          className="flex-1 min-w-40"
        />
        <Button type="submit" size="sm" variant="outline">
          Save
        </Button>
      </ActionForm>
    </div>
  );
}
