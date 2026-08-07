import { Plus, ExternalLink, CheckCircle2, Trash2 } from "lucide-react";
import {
  upsertCoreMeeting,
  updateTeamsMeeting,
  markMeetingOccurred,
  deleteTeamsMeeting,
} from "@/lib/actions";
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  RECURRENCE_TYPES,
  RECURRENCE_LABELS,
} from "@/lib/constants";
import {
  computeMeetingStatus,
  nextOccurrence,
  recurrenceDisplay,
} from "@/lib/meeting-status";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { MeetingRecurrenceControl } from "@/components/meeting-recurrence-control";
import { SafeLink } from "@/components/safe-link";
import { ActionForm } from "@/components/action-form";
import { ControlledInput } from "@/components/controlled-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type MeetingRecord = {
  id: string;
  url: string;
  dayOfWeek: string | null;
  time: string | null;
  recurrenceType: string | null;
  recurrenceLabel: string | null;
  lastOccurredAt: Date | null;
};

function DaySelect({ defaultValue }: { defaultValue: string }) {
  return (
    <select
      name="dayOfWeek"
      defaultValue={defaultValue}
      className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs"
    >
      <option value="">Day…</option>
      {WEEKDAYS.map((d) => (
        <option key={d} value={d}>
          {WEEKDAY_LABELS[d]}
        </option>
      ))}
    </select>
  );
}

export function RecurrenceFields() {
  return (
    <div className="flex gap-2">
      <select
        name="recurrenceType"
        defaultValue=""
        className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs"
      >
        <option value="">Recurrence…</option>
        {RECURRENCE_TYPES.map((r) => (
          <option key={r} value={r}>
            {RECURRENCE_LABELS[r]}
          </option>
        ))}
      </select>
      <input
        name="recurrenceLabel"
        placeholder="Custom text (if Custom)"
        className="h-8 flex-1 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs"
      />
    </div>
  );
}

export function MeetingCard({
  projectId,
  code,
  type,
  title,
  meeting,
}: {
  projectId: string;
  code: string;
  type: string;
  title: string;
  meeting: MeetingRecord | null;
}) {
  const status = computeMeetingStatus(meeting);

  // Missing core slot: compact inline "create" card, no id yet.
  if (!meeting) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="font-medium text-sm">{title}</span>
          <MeetingStatusBadge status="MISSING" />
        </CardHeader>
        <CardContent>
          <ActionForm action={upsertCoreMeeting} className="space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="type" value={type} />
            <ControlledInput
              name="url"
              placeholder="Meeting link"
              defaultValue=""
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <DaySelect defaultValue="" />
              <input
                name="time"
                placeholder="10:00"
                className="h-8 w-20 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs"
              />
            </div>
            <RecurrenceFields />
            <Button type="submit" size="sm" className="w-full">
              <Plus className="size-3.5" />
              Add meeting
            </Button>
          </ActionForm>
        </CardContent>
      </Card>
    );
  }

  const next = nextOccurrence(meeting.dayOfWeek);
  const dayLabel = meeting.dayOfWeek
    ? WEEKDAY_LABELS[meeting.dayOfWeek as keyof typeof WEEKDAY_LABELS]
    : "Day not set";
  const recurrence = recurrenceDisplay(
    meeting.recurrenceType,
    meeting.recurrenceLabel
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="font-medium text-sm">{title}</span>
        <MeetingStatusBadge status={status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>
            {dayLabel}
            {meeting.time ? ` · ${meeting.time}` : ""}
            {recurrence ? ` · ${recurrence}` : ""}
          </p>
          <p>
            Last occurred:{" "}
            {meeting.lastOccurredAt
              ? new Date(meeting.lastOccurredAt).toLocaleDateString()
              : "never logged"}
          </p>
          <p>
            Next occurrence:{" "}
            {next
              ? next.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </p>
        </div>

        <SafeLink
          href={meeting.url}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <ExternalLink className="size-3.5" />
          Join meeting
        </SafeLink>

        <div>
          <label className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            Recurrence
          </label>
          <MeetingRecurrenceControl
            meetingId={meeting.id}
            code={code}
            recurrenceType={meeting.recurrenceType}
            recurrenceLabel={meeting.recurrenceLabel}
          />
        </div>

        <div className="flex gap-2">
          <form action={markMeetingOccurred} className="flex-1">
            <input type="hidden" name="id" value={meeting.id} />
            <input type="hidden" name="code" value={code} />
            <Button type="submit" size="sm" variant="outline" className="w-full">
              <CheckCircle2 className="size-3.5" />
              Mark occurred
            </Button>
          </form>
          <form action={deleteTeamsMeeting}>
            <input type="hidden" name="id" value={meeting.id} />
            <input type="hidden" name="code" value={code} />
            <Button type="submit" size="sm" variant="ghost">
              <Trash2 className="size-3.5" />
              Remove
            </Button>
          </form>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Edit schedule / link
          </summary>
          <ActionForm action={updateTeamsMeeting} className="space-y-2 pt-2">
            <input type="hidden" name="id" value={meeting.id} />
            <input type="hidden" name="code" value={code} />
            <ControlledInput
              name="url"
              defaultValue={meeting.url}
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <DaySelect defaultValue={meeting.dayOfWeek ?? ""} />
              <ControlledInput
                name="time"
                placeholder="10:00"
                defaultValue={meeting.time ?? ""}
                className="h-8 w-20 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="w-full">
              Save
            </Button>
          </ActionForm>
        </details>
      </CardContent>
    </Card>
  );
}
