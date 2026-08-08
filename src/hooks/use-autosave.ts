"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions";

const DEFAULT_DEBOUNCE_MS = 450;

function isActionResult(value: unknown): value is Exclude<ActionResult, void> {
  return (
    typeof value === "object" &&
    value !== null &&
    ("error" in value || "info" in value)
  );
}

/**
 * Shared autosave helper: wraps a Server Action call in a transition and
 * surfaces a short success/error toast. Debounced variant is for free-text
 * fields (type freely, persist shortly after the last keystroke; blur
 * flushes immediately via `save`).
 *
 * If the action returns `{ error }` / `{ info }`, that message is used
 * instead of the default success toast.
 */
export function useAutosave() {
  const [isPending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumps on every schedule so an in-flight delayed save can detect it was
  // superseded by a later edit (or an immediate flush).
  const generationRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const run = useCallback(
    async (
      fn: () => Promise<unknown>,
      opts?: { message?: string; silent?: boolean }
    ) => {
      try {
        const result = await fn();
        if (isActionResult(result)) {
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          if ("info" in result) {
            toast.info(result.info);
            return;
          }
        }
        if (!opts?.silent) {
          toast.success(opts?.message ?? "Saved");
        }
      } catch {
        toast.error("Couldn't save — try again.");
      }
    },
    []
  );

  const save = useCallback(
    (
      fn: () => Promise<unknown>,
      opts?: { message?: string; silent?: boolean }
    ) => {
      // Cancel any pending debounced call — an explicit save always wins.
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      generationRef.current += 1;

      startTransition(async () => {
        await run(fn, opts);
      });
    },
    [run]
  );

  const saveDebounced = useCallback(
    (
      fn: () => Promise<unknown>,
      opts?: { message?: string; delay?: number; silent?: boolean }
    ) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const generation = ++generationRef.current;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        // Drop if a newer schedule/save landed while we were waiting.
        if (generation !== generationRef.current) return;
        startTransition(async () => {
          // Re-check after the transition starts — another keystroke may
          // have cancelled us between timer fire and transition begin.
          if (generation !== generationRef.current) return;
          await run(fn, opts);
        });
      }, opts?.delay ?? DEFAULT_DEBOUNCE_MS);
    },
    [run]
  );

  return { isPending, save, saveDebounced };
}
