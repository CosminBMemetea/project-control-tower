"use client";

import { useState, useTransition } from "react";
import { RECURRENCE_TYPES, RECURRENCE_LABELS } from "@/lib/constants";
import { setMeetingRecurrence } from "@/lib/actions";

// Quick, always-visible recurrence editor for an existing meeting —
// auto-saves on change so recurrence can be set (or corrected)
// retroactively in one click, no need to open the schedule edit panel.
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
  const [label, setLabel] = useState(serverLabel ?? "");
  const [prevServerType, setPrevServerType] = useState(serverType ?? "");
  const [prevServerLabel, setPrevServerLabel] = useState(serverLabel ?? "");
  const [isPending, startTransition] = useTransition();

  const nextServerType = serverType ?? "";
  const nextServerLabel = serverLabel ?? "";
  if (nextServerType !== prevServerType || nextServerLabel !== prevServerLabel) {
    setPrevServerType(nextServerType);
    setPrevServerLabel(nextServerLabel);
    setType(nextServerType);
    setLabel(nextServerLabel);
  }

  function save(nextType: string, nextLabel: string) {
    startTransition(async () => {
      await setMeetingRecurrence(meetingId, code, nextType, nextLabel);
    });
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
          save(next, label);
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
        <input
          aria-label="Custom recurrence"
          value={label}
          disabled={isPending}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => save(type, label)}
          placeholder="e.g. every 3 weeks on Thu"
          className="h-7 flex-1 min-w-0 rounded-md border border-input bg-transparent px-1.5 text-xs shadow-xs disabled:opacity-50"
        />
      )}
    </div>
  );
}
