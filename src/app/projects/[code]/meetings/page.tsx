import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  addTeamsMeeting,
  markMeetingOccurred,
  deleteTeamsMeeting,
} from "@/lib/actions";
import { MEETING_TYPES, MEETING_TYPE_LABELS } from "@/lib/constants";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const coreTypes = ["WEEKLY", "SPRINT_REVIEW", "RETRO"];
  const healthy = coreTypes.every((t) =>
    project.teamsMeetings.some((m) => m.type === t)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Meeting Map & Cadence</CardTitle>
          <Badge variant={healthy ? "default" : "outline"}>
            {healthy ? "Cadence healthy" : "Cadence incomplete"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {project.teamsMeetings.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recurring meetings linked yet.
              </p>
            )}
            {project.teamsMeetings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {MEETING_TYPE_LABELS[m.type as keyof typeof MEETING_TYPE_LABELS] ??
                      m.type}
                    {m.label ? ` — ${m.label}` : ""}
                  </span>{" "}
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Join in Teams
                  </a>
                  <div className="text-xs text-muted-foreground">
                    Last occurred:{" "}
                    {m.lastOccurredAt
                      ? new Date(m.lastOccurredAt).toLocaleDateString()
                      : "never logged"}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <form action={markMeetingOccurred}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="code" value={project.code} />
                    <Button type="submit" size="sm" variant="outline">
                      Mark occurred
                    </Button>
                  </form>
                  <form action={deleteTeamsMeeting}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="code" value={project.code} />
                    <Button type="submit" size="sm" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <form
            action={addTeamsMeeting}
            className="flex flex-wrap items-end gap-3 pt-2 border-t"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                name="type"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                {MEETING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {MEETING_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">
                Label (optional)
              </label>
              <Input name="label" placeholder="e.g. Design sync" className="w-40" />
            </div>
            <div className="grid gap-1.5 flex-1 min-w-48">
              <label className="text-xs text-muted-foreground">
                Teams link
              </label>
              <Input name="url" placeholder="https://teams.microsoft.com/..." />
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
