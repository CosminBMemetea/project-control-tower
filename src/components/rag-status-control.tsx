"use client";

import { useState, useTransition } from "react";
import { RAG_STATUSES, type RagStatus } from "@/lib/constants";
import { setRagComment, setRagStatus } from "@/lib/actions";
import { RagBadge } from "@/components/rag-badge";
import { ControlledInput } from "@/components/controlled-input";
import { Button } from "@/components/ui/button";

/**
 * The one control that can change a Project's RAG status. Status
 * auto-saves the moment the dropdown changes (same pattern as
 * GoalLevelSelect); the optional comment is a separate save so editing
 * one can never clobber an in-flight change to the other.
 *
 * `compact` drops the comment field and select label, for use inline in
 * the Portfolio Overview grid; the full layout is for the project header.
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
  const [isPending, startTransition] = useTransition();

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
        <select
          aria-label="RAG status"
          value={status}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.value as RagStatus;
            setStatus(next);
            startTransition(async () => {
              await setRagStatus(projectId, code, next);
            });
          }}
          className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs shadow-xs disabled:opacity-50"
        >
          {RAG_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {!compact && (
        <form
          action={setRagComment}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="code" value={code} />
          <ControlledInput
            name="ragComment"
            placeholder="Optional reason for current status"
            defaultValue={comment ?? ""}
            maxLength={200}
            className="h-8 text-sm w-64"
          />
          <Button type="submit" size="sm" variant="outline">
            Save
          </Button>
        </form>
      )}
    </div>
  );
}
