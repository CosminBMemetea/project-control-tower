"use client";

import { useState } from "react";
import { useAutosave } from "@/hooks/use-autosave";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CommonProps = {
  /** Latest value from the server (re-synced after revalidation). */
  value: string;
  /** Persist the new value. Called only when it actually changed. */
  onSave: (value: string) => Promise<unknown>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  maxLength?: number;
  "aria-label"?: string;
};

/**
 * Controlled text input that autosaves on blur and (debounced) on change.
 * Prefer this over a manual form + Save button for free-text project fields.
 */
export function AutosaveInput({
  value: serverValue,
  onSave,
  className,
  disabled,
  ...props
}: CommonProps & {
  type?: React.ComponentProps<typeof Input>["type"];
}) {
  const [value, setValue] = useState(serverValue);
  const [lastSaved, setLastSaved] = useState(serverValue);
  const [prevServerValue, setPrevServerValue] = useState(serverValue);
  const { save, saveDebounced } = useAutosave();

  if (serverValue !== prevServerValue) {
    setPrevServerValue(serverValue);
    setValue(serverValue);
    setLastSaved(serverValue);
  }

  function commit(next: string, mode: "now" | "debounce") {
    if (next === lastSaved) return;
    const run = async () => {
      const result = await onSave(next);
      // Only mark as saved on success so a failed write can be retried.
      if (result && typeof result === "object" && "error" in result) {
        return result;
      }
      setLastSaved(next);
      return result;
    };
    if (mode === "now") save(run);
    else saveDebounced(run);
  }

  return (
    <Input
      {...props}
      value={value}
      disabled={disabled}
      className={className}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        commit(next, "debounce");
      }}
      onBlur={() => commit(value, "now")}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

/**
 * Controlled textarea with the same blur + debounced onChange autosave
 * behaviour as AutosaveInput. Used for multi-line fields (risk notes,
 * report sections, etc.).
 */
export function AutosaveTextarea({
  value: serverValue,
  onSave,
  className,
  disabled,
  rows,
  ...props
}: CommonProps & { rows?: number }) {
  const [value, setValue] = useState(serverValue);
  const [lastSaved, setLastSaved] = useState(serverValue);
  const [prevServerValue, setPrevServerValue] = useState(serverValue);
  const { save, saveDebounced } = useAutosave();

  if (serverValue !== prevServerValue) {
    setPrevServerValue(serverValue);
    setValue(serverValue);
    setLastSaved(serverValue);
  }

  function commit(next: string, mode: "now" | "debounce") {
    if (next === lastSaved) return;
    const run = async () => {
      const result = await onSave(next);
      if (result && typeof result === "object" && "error" in result) {
        return result;
      }
      setLastSaved(next);
      return result;
    };
    if (mode === "now") save(run);
    else saveDebounced(run);
  }

  return (
    <Textarea
      {...props}
      rows={rows}
      value={value}
      disabled={disabled}
      className={cn(className)}
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        commit(next, "debounce");
      }}
      onBlur={() => commit(value, "now")}
    />
  );
}
