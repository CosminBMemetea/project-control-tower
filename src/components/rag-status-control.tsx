"use client";

import { useState } from "react";
import { RAG_STATUSES, type RagStatus } from "@/lib/constants";
import { setRagComment, setRagStatus } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";
import { RagBadge } from "@/components/rag-badge";
import { AutosaveInput } from "@/components/autosave-text-field";

/**
 * The one control that can change a Project's RAG status.
 * - Status buttons/select: update UI instantly + save immediately.
 * - Optional reason: blur + debounced autosave (no Save button).
 *
 * `compact` drops the comment field, for use inline in denser layouts.
 */
export function RagStatusControl({
  projectId,
  code,
  status: serverStatus,
  comment,
  size = "sm",
  compact = false,
}: {
  projectId: string;
  code: string;
  status: string;
  comment?: string | null;
  size?: "sm" | "lg";
  compact?: boolean;
}) {
  const [status, setStatus] = useState(serverStatus as RagStatus);
  const [prevServerStatus, setPrevServerStatus] = useState(serverStatus);
  const { isPending, save } = useAutosave();

  if (serverStatus !== prevServerStatus) {
    setPrevServerStatus(serverStatus);
    setStatus(serverStatus as RagStatus);
  }

  return (
    <div
      className={compact ? "flex items-center gap-1.5" : "flex flex-col gap-2"}
    >
      <div className="flex items-center gap-2" title={comment || undefined}>
        <RagBadge status={status} size={size} />
        <div
          className="inline-flex rounded-md border border-input p-0.5 gap-0.5"
          role="group"
          aria-label="RAG status"
        >
          {RAG_STATUSES.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                disabled={isPending}
                aria-pressed={active}
                onClick={() => {
                  if (s === status) return;
                  // Instant UI update — don't wait for the server round-trip.
                  setStatus(s);
                  save(() => setRagStatus(projectId, code, s));
                }}
                className={
                  active
                    ? s === "GREEN"
                      ? "rounded px-2 py-0.5 text-xs font-medium bg-emerald-600 text-white disabled:opacity-50"
                      : s === "AMBER"
                        ? "rounded px-2 py-0.5 text-xs font-medium bg-amber-500 text-white disabled:opacity-50"
                        : "rounded px-2 py-0.5 text-xs font-medium bg-red-600 text-white disabled:opacity-50"
                    : "rounded px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-50"
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      {!compact && (
        <AutosaveInput
          placeholder="Optional reason for current status"
          value={comment ?? ""}
          maxLength={200}
          className="h-8 text-sm w-64"
          aria-label="RAG status reason"
          onSave={(next) => setRagComment(projectId, code, next)}
        />
      )}
    </div>
  );
}
