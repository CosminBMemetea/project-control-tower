import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendChecklist } from "@/lib/actions";
import { CHECKLIST_QUESTIONS, CHECKLIST_VERIFICATION_DAYS } from "@/lib/constants";
import { computeChecklistStatus } from "@/lib/checklist-status";
import { getAppBaseUrl } from "@/lib/email";
import { buildMailto } from "@/lib/mailto";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { ChecklistStatusBadge } from "@/components/checklist-status-badge";
import { ActionForm } from "@/components/action-form";
import { CopyLinkButton } from "@/components/copy-link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ChecklistPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [project, questions] = await Promise.all([
    prisma.project.findUnique({
      where: { code },
      include: {
        checklistSubmissions: { orderBy: { sentAt: "desc" } },
        goalProgress: { where: { goalType: "REPORTING_CHECKLIST" } },
      },
    }),
    prisma.checklistQuestion.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!project) notFound();

  const baseUrl = await getAppBaseUrl();
  const goal = project.goalProgress[0];
  const status = computeChecklistStatus(project.checklistSubmissions);
  const lastSubmitted = project.checklistSubmissions
    .filter((s) => s.submittedAt)
    .sort((a, b) => b.submittedAt!.getTime() - a.submittedAt!.getTime())[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Send Reporting Checklist
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            For any email address — yourself or a team member. Creates a
            link below you can copy or open in your email app; if SMTP is
            configured it&apos;s also emailed automatically. They answer
            via the link, no account needed, and it&apos;s collected back
            here.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            {questions.map((q) => (
              <li key={q.id}>{q.text}</li>
            ))}
          </ol>

          <ActionForm
            action={sendChecklist}
            className="flex flex-wrap items-end gap-3 pt-2 border-t"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <div className="grid gap-1.5 flex-1 min-w-56">
              <label className="text-xs text-muted-foreground">
                Recipient email
              </label>
              <Input
                type="email"
                name="recipientEmail"
                placeholder="name@company.com"
              />
            </div>
            <Button type="submit" size="sm">
              Create Checklist
            </Button>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Project Awareness</CardTitle>
          <ChecklistStatusBadge status={status} />
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {lastSubmitted ? (
            <p>
              Last verified by{" "}
              <span className="font-medium text-foreground">
                {lastSubmitted.recipientEmail}
              </span>{" "}
              on {new Date(lastSubmitted.submittedAt!).toLocaleDateString()}.
              Verification is expected at least every{" "}
              {CHECKLIST_VERIFICATION_DAYS} days.
            </p>
          ) : (
            <p>
              No completed checklist yet. Verification is expected at least
              every {CHECKLIST_VERIFICATION_DAYS} days.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submission History</CardTitle>
        </CardHeader>
        <CardContent>
          {project.checklistSubmissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No checklist has been sent yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.checklistSubmissions.map((sub) => {
                  const link = `${baseUrl}/checklist-response/${sub.token}`;
                  const mailto = buildMailto({
                    to: sub.recipientEmail,
                    subject: `Reporting Checklist — ${project.name}`,
                    body: `Hi,\n\nCould you fill in the Reporting Checklist for ${project.name}?\n\n${link}\n\nIt covers ${CHECKLIST_QUESTIONS.length} short questions on status, risks, and dependencies — should take a few minutes.\n\nThanks!`,
                  });
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(sub.sentAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{sub.recipientEmail}</TableCell>
                      <TableCell>
                        <Badge variant={sub.submittedAt ? "default" : "outline"}>
                          {sub.submittedAt
                            ? `Answered ${new Date(sub.submittedAt).toLocaleDateString()}`
                            : "Awaiting answers"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            href={`/checklist-response/${sub.token}`}
                            target="_blank"
                            className="text-xs text-primary underline px-2"
                          >
                            Open
                          </Link>
                          <CopyLinkButton link={link} />
                          <a
                            href={mailto}
                            className={buttonVariants({ variant: "ghost", size: "sm" })}
                          >
                            Email
                          </a>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {goal && (
        <GoalProgressForm
          projectId={project.id}
          code={project.code}
          goalType="REPORTING_CHECKLIST"
          level={goal.level}
          evidenceUrl={goal.evidenceUrl}
        />
      )}
    </div>
  );
}
