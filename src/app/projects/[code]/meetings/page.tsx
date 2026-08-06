import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addTeamsMeeting } from "@/lib/actions";
import {
  CORE_MEETING_TYPES,
  MEETING_TYPE_LABELS,
  WEEKDAYS,
  WEEKDAY_LABELS,
} from "@/lib/constants";
import { computeMeetingStatus, type MeetingStatus } from "@/lib/meeting-status";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { MeetingCard, RecurrenceFields } from "@/components/meeting-card";
import { MeetingStatusBadge } from "@/components/meeting-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function MeetingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      teamsMeetings: { orderBy: { type: "asc" } },
      goalProgress: { where: { goalType: "MEETING_CADENCE" } },
    },
  });

  if (!project) notFound();

  const goal = project.goalProgress[0];

  const coreMeetings = CORE_MEETING_TYPES.map((type) => ({
    type,
    title: MEETING_TYPE_LABELS[type],
    meeting: project.teamsMeetings.find((m) => m.type === type) ?? null,
  }));
  const customMeetings = project.teamsMeetings.filter((m) => m.type === "OTHER");

  const allStatuses: MeetingStatus[] = [
    ...coreMeetings.map((m) => computeMeetingStatus(m.meeting)),
    ...customMeetings.map((m) => computeMeetingStatus(m)),
  ];
  const summary = {
    ACTIVE: allStatuses.filter((s) => s === "ACTIVE").length,
    MISSING: allStatuses.filter((s) => s === "MISSING").length,
    NEEDS_UPDATE: allStatuses.filter((s) => s === "NEEDS_UPDATE").length,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Meeting Map</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              The full communication plan for this project — every recurring
              meeting, its Teams link, schedule, and status, visible to
              stakeholders at a glance.
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <MeetingStatusBadge status="ACTIVE" />
            <span className="text-xs text-muted-foreground self-center">
              {summary.ACTIVE}
            </span>
            <MeetingStatusBadge status="NEEDS_UPDATE" />
            <span className="text-xs text-muted-foreground self-center">
              {summary.NEEDS_UPDATE}
            </span>
            <MeetingStatusBadge status="MISSING" />
            <span className="text-xs text-muted-foreground self-center">
              {summary.MISSING}
            </span>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coreMeetings.map(({ type, title, meeting }) => (
          <MeetingCard
            key={type}
            projectId={project.id}
            code={project.code}
            type={type}
            title={title}
            meeting={meeting}
          />
        ))}
        {customMeetings.map((m) => (
          <MeetingCard
            key={m.id}
            projectId={project.id}
            code={project.code}
            type="OTHER"
            title={m.label || "Other meeting"}
            meeting={m}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Another Meeting</CardTitle>
          <p className="text-xs text-muted-foreground">
            For anything beyond the 3 core meetings above — design syncs,
            steering committees, etc.
          </p>
        </CardHeader>
        <CardContent>
          <form
            action={addTeamsMeeting}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <input type="hidden" name="type" value="OTHER" />
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input name="label" placeholder="e.g. Design Sync" className="w-40" />
            </div>
            <div className="grid gap-1.5 flex-1 min-w-48">
              <label className="text-xs text-muted-foreground">
                Teams link
              </label>
              <Input name="url" placeholder="https://teams.microsoft.com/..." />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Day</label>
              <select
                name="dayOfWeek"
                defaultValue=""
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                <option value="">—</option>
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {WEEKDAY_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Time</label>
              <Input name="time" placeholder="10:00" className="w-24" />
            </div>
            <div className="grid gap-1.5 basis-full sm:basis-auto sm:w-64">
              <label className="text-xs text-muted-foreground">
                Recurrence
              </label>
              <RecurrenceFields />
            </div>
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {goal && (
        <GoalProgressForm
          projectId={project.id}
          code={project.code}
          goalType="MEETING_CADENCE"
          level={goal.level}
          evidenceUrl={goal.evidenceUrl}
        />
      )}
    </div>
  );
}
