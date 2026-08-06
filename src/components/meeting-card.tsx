import {
  upsertCoreMeeting,
  updateTeamsMeeting,
  markMeetingOccurred,
  deleteTeamsMeeting,
} from "@/lib/actions";
import { WEEKDAYS, WEEKDAY_LABELS } from "@/lib/constants";
import { computeMeetingStatus, nextOccurrence } from "@/lib/meeting-status";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { ControlledInput } from "@/components/controlled-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type MeetingRecord = {
  id: string;
  url: string;
  dayOfWeek: string | null;
  time: string | null;
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
          <form action={upsertCoreMeeting} className="space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="type" value={type} />
            <ControlledInput
              name="url"
              placeholder="Teams link"
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
            <Button type="submit" size="sm" className="w-full">
              Add meeting
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const next = nextOccurrence(meeting.dayOfWeek);
  const dayLabel = meeting.dayOfWeek
    ? WEEKDAY_LABELS[meeting.dayOfWeek as keyof typeof WEEKDAY_LABELS]
    : "Day not set";

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

        <a
          href={meeting.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Join in Teams
        </a>

        <div className="flex gap-2">
          <form action={markMeetingOccurred} className="flex-1">
            <input type="hidden" name="id" value={meeting.id} />
            <input type="hidden" name="code" value={code} />
            <Button type="submit" size="sm" variant="outline" className="w-full">
              Mark occurred
            </Button>
          </form>
          <form action={deleteTeamsMeeting}>
            <input type="hidden" name="id" value={meeting.id} />
            <input type="hidden" name="code" value={code} />
            <Button type="submit" size="sm" variant="ghost">
              Remove
            </Button>
          </form>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Edit schedule / link
          </summary>
          <form action={updateTeamsMeeting} className="space-y-2 pt-2">
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
          </form>
        </details>
      </CardContent>
    </Card>
  );
}
