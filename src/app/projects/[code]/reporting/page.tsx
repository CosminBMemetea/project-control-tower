import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentReportingPeriod } from "@/lib/period";
import { GOAL_TYPES, GOAL_LABELS } from "@/lib/constants";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalBadge } from "@/components/goal-badge";
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {period} Report — Preview
          </CardTitle>
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
