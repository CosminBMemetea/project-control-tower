"use client";

import { useState, useTransition } from "react";
import { setAllocatedFte } from "@/lib/actions";
import { Input } from "@/components/ui/input";

// Auto-saves on blur (not per-keystroke, since it's free-text entry, not
// a discrete choice like GoalLevelSelect) — mirrors the server value on
// render so a revalidation from elsewhere on the page never fights an
// in-progress edit here.
export function FteInput({
  projectId,
  code,
  value: serverValue,
  compact = false,
}: {
  projectId: string;
  code: string;
  value: number;
  compact?: boolean;
}) {
  const [value, setValue] = useState(String(serverValue));
  const [prevServerValue, setPrevServerValue] = useState(serverValue);
  const [isPending, startTransition] = useTransition();

  if (serverValue !== prevServerValue) {
    setPrevServerValue(serverValue);
    setValue(String(serverValue));
  }

  function commit() {
    const parsed = Number(value);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    setValue(String(next));
    if (next === serverValue) return;
    startTransition(async () => {
      await setAllocatedFte(projectId, code, next);
    });
  }

  return (
    <Input
      type="number"
      inputMode="decimal"
      min={0}
      step={0.1}
      aria-label="Allocated FTE"
      value={value}
      disabled={isPending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={compact ? "h-7 w-16 px-1.5 text-xs text-center" : "h-8 w-24"}
    />
  );
}
