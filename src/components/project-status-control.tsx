"use client";

import { useState } from "react";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_DESCRIPTIONS,
  PROJECT_STATUS_EMOJI,
  PROJECT_STATUS_LABELS,
  toProjectStatus,
} from "@/lib/constants";
import { setProjectStatus } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";

/**
 * The one control that can change a Project's lifecycle status. Auto-saves
 * on change via setProjectStatus — no separate Save button.
 */
export function ProjectStatusControl({
  projectId,
  code,
  status: serverStatus,
}: {
  projectId: string;
  code: string;
  status: string;
}) {
  const [status, setStatus] = useState(toProjectStatus(serverStatus));
  const [prevServerStatus, setPrevServerStatus] = useState(serverStatus);
  const { isPending, save } = useAutosave();

  if (serverStatus !== prevServerStatus) {
    setPrevServerStatus(serverStatus);
    setStatus(toProjectStatus(serverStatus));
  }

  return (
    <select
      aria-label="Project status"
      title={PROJECT_STATUS_DESCRIPTIONS[status]}
      value={status}
      disabled={isPending}
      onChange={(e) => {
        const next = toProjectStatus(e.target.value);
        setStatus(next);
        save(() => setProjectStatus(projectId, code, next));
      }}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm font-medium shadow-xs disabled:opacity-50"
    >
      {PROJECT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {PROJECT_STATUS_EMOJI[s]} {PROJECT_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
