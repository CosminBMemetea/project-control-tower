"use client";

import { useState } from "react";
import { RECURRENCE_TYPES, RECURRENCE_LABELS } from "@/lib/constants";
import { setMeetingRecurrence } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveInput } from "@/components/autosave-text-field";

// Quick, always-visible recurrence editor for an existing meeting —
// auto-saves on change / blur. No separate Save button.
export function MeetingRecurrenceControl({
  meetingId,
  code,
  recurrenceType: serverType,
  recurrenceLabel: serverLabel,
}: {
  meetingId: string;
  code: string;
  recurrenceType: string | null;
  recurrenceLabel: string | null;
}) {
  const [type, setType] = useState(serverType ?? "");
  const [prevServerType, setPrevServerType] = useState(serverType ?? "");
  const { isPending, save } = useAutosave();

  const nextServerType = serverType ?? "";
  if (nextServerType !== prevServerType) {
    setPrevServerType(nextServerType);
    setType(nextServerType);
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        aria-label="Recurrence"
        value={type}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value;
          setType(next);
          // Custom label only applies when type is CUSTOM — clear on switch.
          const label = next === "CUSTOM" ? (serverLabel ?? "") : "";
          save(() => setMeetingRecurrence(meetingId, code, next, label));
        }}
        className="h-7 flex-1 rounded-md border border-input bg-transparent px-1.5 text-xs shadow-xs disabled:opacity-50"
      >
        <option value="">No recurrence set</option>
        {RECURRENCE_TYPES.map((r) => (
          <option key={r} value={r}>
            {RECURRENCE_LABELS[r]}
          </option>
        ))}
      </select>
      {type === "CUSTOM" && (
        <AutosaveInput
          aria-label="Custom recurrence"
          value={serverLabel ?? ""}
          placeholder="e.g. every 3 weeks on Thu"
          className="h-7 flex-1 min-w-0 text-xs"
          onSave={(next) =>
            setMeetingRecurrence(meetingId, code, "CUSTOM", next)
          }
        />
      )}
    </div>
  );
}
