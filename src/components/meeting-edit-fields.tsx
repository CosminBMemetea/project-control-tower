"use client";

import { useState } from "react";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/constants";
import { setTeamsMeetingField } from "@/lib/actions";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveInput } from "@/components/autosave-text-field";

/**
 * Autosave controls for an existing meeting's url / day / time.
 * Replaces the old "Edit schedule / link" form + Save button.
 */
export function MeetingEditFields({
  meetingId,
  code,
  url,
  dayOfWeek,
  time,
}: {
  meetingId: string;
  code: string;
  url: string;
  dayOfWeek: string | null;
  time: string | null;
}) {
  const [day, setDay] = useState(dayOfWeek ?? "");
  const [prevDay, setPrevDay] = useState(dayOfWeek ?? "");
  const { isPending, save } = useAutosave();

  const nextServerDay = dayOfWeek ?? "";
  if (nextServerDay !== prevDay) {
    setPrevDay(nextServerDay);
    setDay(nextServerDay);
  }

  function saveField(field: "url" | "dayOfWeek" | "time", value: string) {
    return setTeamsMeetingField(meetingId, code, field, value);
  }

  return (
    <div className="space-y-2 pt-2">
      <AutosaveInput
        value={url}
        placeholder="Meeting link"
        className="h-8 text-xs"
        aria-label="Meeting link"
        onSave={(next) => saveField("url", next)}
      />
      <div className="flex gap-2">
        <select
          aria-label="Day of week"
          value={day}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.value;
            setDay(next);
            save(() => saveField("dayOfWeek", next));
          }}
          className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs disabled:opacity-50"
        >
          <option value="">Day…</option>
          {WEEKDAYS.map((d) => (
            <option key={d} value={d}>
              {WEEKDAY_LABELS[d]}
            </option>
          ))}
        </select>
        <AutosaveInput
          value={time ?? ""}
          placeholder="10:00"
          className="h-8 w-20 text-xs"
          aria-label="Meeting time"
          onSave={(next) => saveField("time", next)}
        />
      </div>
      <p className="text-[0.65rem] text-muted-foreground">
        Changes save automatically.
      </p>
    </div>
  );
}
