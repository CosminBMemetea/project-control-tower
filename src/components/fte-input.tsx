"use client";

import { useState } from "react";
import { setAllocatedFte } from "@/lib/actions";
import { MAX_ALLOCATED_FTE } from "@/lib/constants";
import { useAutosave } from "@/hooks/use-autosave";
import { Input } from "@/components/ui/input";

/**
 * Format a number for display without inventing extra decimals, and
 * without collapsing meaningful precision (1.25 stays "1.25", not "1.3").
 */
function formatFte(n: number): string {
  if (!Number.isFinite(n)) return "0";
  // toString keeps short decimals exact (1.25 → "1.25"); no forced rounding.
  return String(n);
}

// Auto-saves on blur + debounced change. Stores exact decimal values —
// never rounds (1.2, 1.25, 1.9, 0.5 all persist as typed).
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
  const [value, setValue] = useState(formatFte(serverValue));
  const [lastSaved, setLastSaved] = useState(serverValue);
  const [prevServerValue, setPrevServerValue] = useState(serverValue);
  const { isPending, save, saveDebounced } = useAutosave();

  if (serverValue !== prevServerValue) {
    setPrevServerValue(serverValue);
    setValue(formatFte(serverValue));
    setLastSaved(serverValue);
  }

  function parseExact(raw: string): number | null {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "." || trimmed === "-") return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return Math.min(Math.max(parsed, 0), MAX_ALLOCATED_FTE);
  }

  function commit(raw: string, mode: "now" | "debounce") {
    const next = parseExact(raw);
    if (next === null) {
      // Incomplete/invalid mid-edit — only reset on blur (explicit commit).
      if (mode === "now") setValue(formatFte(lastSaved));
      return;
    }
    // Keep the user's typed string while editing; normalize display only
    // after a successful parse on blur so "1.250" becomes "1.25" cleanly
    // without fighting keystrokes.
    if (mode === "now") setValue(formatFte(next));
    if (next === lastSaved) return;

    const run = async () => {
      await setAllocatedFte(projectId, code, next);
      setLastSaved(next);
    };
    if (mode === "now") save(run);
    else saveDebounced(run);
  }

  return (
    <Input
      type="number"
      inputMode="decimal"
      min={0}
      max={MAX_ALLOCATED_FTE}
      // "any", not a fixed step: a numeric step makes the browser snap
      // the value to that grid on every arrow-key/spinner nudge (e.g.
      // step={0.1} turns a typed 1.25 into 1.3). FTE must keep whatever
      // precision was typed.
      step="any"
      aria-label="Allocated FTE"
      value={value}
      aria-busy={isPending}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        commit(next, "debounce");
      }}
      onBlur={() => commit(value, "now")}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
      className={compact ? "h-7 w-16 px-1.5 text-xs text-center" : "h-8 w-24"}
    />
  );
}
