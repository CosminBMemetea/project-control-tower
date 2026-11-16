"use client";

import { useState } from "react";
import {
  HEALTH_SCORES,
  HEALTH_SCORE_LABELS,
  HEALTH_DIMENSION_LABELS,
  type HealthDimension,
} from "@/lib/constants";
import { setHealthComment, setHealthScore } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveInput } from "@/components/autosave-text-field";

// Score auto-saves the moment the dropdown changes; the comment is a
// separate blur/debounced save so editing one can never clobber the other.
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
  const { isPending, save } = useAutosave();

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
          save(() => setHealthScore(projectId, code, dimension, next));
        }}
        className="h-8 w-36 shrink-0 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs disabled:opacity-50"
      >
        {HEALTH_SCORES.map((s) => (
          <option key={s} value={s}>
            {s} – {HEALTH_SCORE_LABELS[s]}
          </option>
        ))}
      </select>
      <AutosaveInput
        placeholder="Optional note explaining the score"
        value={comment ?? ""}
        maxLength={200}
        className="flex-1 min-w-40"
        aria-label={`${HEALTH_DIMENSION_LABELS[dimension]} comment`}
        onSave={(next) => setHealthComment(projectId, code, dimension, next)}
      />
    </div>
  );
}
