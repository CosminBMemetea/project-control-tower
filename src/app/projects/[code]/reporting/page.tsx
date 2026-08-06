import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentReportingPeriod, toDateInputValue } from "@/lib/period";
import { GOAL_TYPES, GOAL_LABELS, REPORT_TYPES, REPORT_TYPE_LABELS } from "@/lib/constants";
import { reportLabel } from "@/lib/report-helpers";
import { createReport, deleteReport } from "@/lib/actions";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { ReportTypeBadge } from "@/components/report-type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalBadge } from "@/components/goal-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ReportingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      goalProgress: true,
      quarterPresentations: { orderBy: { quarter: "desc" }, take: 1 },
      checklistSubmissions: {
        orderBy: { sentAt: "desc" },
        take: 1,
        include: { answers: { include: { question: true } } },
      },
      managerApprovals: true,
      reports: { orderBy: { reportDate: "desc" } },
    },
  });

  if (!project) notFound();

  const goal = project.goalProgress.find(
    (g) => g.goalType === "PERIODIC_REPORTING"
  );
  const period = currentReportingPeriod();
  const latestSubmission = project.checklistSubmissions[0];
  const latestPresentation = project.quarterPresentations[0];
  const approvalsDone = project.managerApprovals.filter((a) => a.approved).length;
  const today = toDateInputValue(new Date());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Report</CardTitle>
          <p className="text-xs text-muted-foreground">
            Reports can be created for any past date — mid/end-month, weekly
            status (Monday &amp; Thursday), or a custom one-off.
          </p>
        </CardHeader>
        <CardContent>
          <form
            action={createReport}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                name="type"
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {REPORT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Date</label>
              <Input type="date" name="reportDate" defaultValue={today} className="w-40" />
            </div>
            <div className="grid gap-1.5 flex-1 min-w-48">
              <label className="text-xs text-muted-foreground">
                Title (optional, mainly for Custom)
              </label>
              <Input name="title" placeholder="e.g. Steering committee update" />
            </div>
            <Button type="submit" size="sm">
              Create &amp; Edit
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report History</CardTitle>
        </CardHeader>
        <CardContent>
          {project.reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reports yet — create the first one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.reports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">
                      {toDateInputValue(new Date(r.reportDate))}
                    </TableCell>
                    <TableCell>
                      <ReportTypeBadge type={r.type} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${project.code}/reporting/${r.id}`}
                        className="hover:underline font-medium"
                      >
                        {reportLabel(r.type, new Date(r.reportDate), r.title)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/projects/${project.code}/reporting/${r.id}`}>
                          <Button type="button" size="sm" variant="outline">
                            Edit
                          </Button>
                        </Link>
                        <form action={deleteReport}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="code" value={project.code} />
                          <Button type="submit" size="sm" variant="ghost">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {period} — Current Snapshot
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            A quick, always-current read on the project — separate from the
            reports above.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <div className="font-medium mb-1">Goal coverage</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GOAL_TYPES.map((g) => {
                const gp = project.goalProgress.find((x) => x.goalType === g);
                return (
                  <div
                    key={g}
                    className="flex items-center justify-between rounded-md border px-2.5 py-1.5"
                  >
                    <span className="text-xs text-muted-foreground">
                      {GOAL_LABELS[g]}
                    </span>
                    <GoalBadge level={gp?.level ?? 0} />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="font-medium mb-1">Latest planning presentation</div>
            <p className="text-muted-foreground">
              {latestPresentation
                ? `${latestPresentation.quarter} — ${latestPresentation.url}`
                : "None on file."}
            </p>
          </div>

          <div>
            <div className="font-medium mb-1">
              120% Business Innovation Process approvals
            </div>
            <p className="text-muted-foreground">
              {approvalsDone}/{project.managerApprovals.length} managers approved
            </p>
          </div>

          <div>
            <div className="font-medium mb-1">Latest checklist submission</div>
            {latestSubmission ? (
              <div className="text-muted-foreground space-y-1">
                <p>
                  {latestSubmission.period} · sent to{" "}
                  {latestSubmission.sentTo === "SELF" ? "me" : "project team"} ·{" "}
                  {latestSubmission.submittedAt ? "submitted" : "awaiting answers"}
                </p>
                <ul className="list-disc list-inside">
                  {latestSubmission.answers
                    .filter((a) => a.answer)
                    .map((a) => (
                      <li key={a.id}>
                        {a.question.text}: {a.answer}
                      </li>
                    ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground">No checklist on file.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {goal && (
        <GoalProgressForm
          projectId={project.id}
          code={project.code}
          goalType="PERIODIC_REPORTING"
          level={goal.level}
          evidenceUrl={goal.evidenceUrl}
        />
      )}
    </div>
  );
}
