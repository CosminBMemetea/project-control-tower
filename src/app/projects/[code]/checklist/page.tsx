import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sendChecklist, submitChecklistAnswers } from "@/lib/actions";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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
        checklistSubmissions: {
          orderBy: { sentAt: "desc" },
          include: { answers: true },
        },
        goalProgress: { where: { goalType: "REPORTING_CHECKLIST" } },
      },
    }),
    prisma.checklistQuestion.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!project) notFound();

  const goal = project.goalProgress[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Reporting Checklist — 10 Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-1.5 text-sm">
            {questions.map((q) => (
              <li key={q.id}>{q.text}</li>
            ))}
          </ol>

          <form action={sendChecklist} className="flex flex-wrap gap-2 pt-2 border-t">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <input type="hidden" name="sentTo" value="SELF" />
            <Button type="submit" size="sm" variant="outline">
              Send Checklist to Me
            </Button>
          </form>
          <form action={sendChecklist} className="flex flex-wrap gap-2">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <input type="hidden" name="sentTo" value="TEAM" />
            <Button type="submit" size="sm" variant="outline">
              Send Checklist to Project Team
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Submissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {project.checklistSubmissions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No checklist has been sent yet.
            </p>
          )}
          {project.checklistSubmissions.map((sub) => (
            <div key={sub.id} className="space-y-3 border-b pb-6 last:border-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{sub.period}</span>{" "}
                  <span className="text-muted-foreground">
                    · sent to {sub.sentTo === "SELF" ? "me" : "project team"} on{" "}
                    {new Date(sub.sentAt).toLocaleDateString()}
                  </span>
                </div>
                <Badge variant={sub.submittedAt ? "default" : "outline"}>
                  {sub.submittedAt ? "Submitted" : "Awaiting answers"}
                </Badge>
              </div>

              <form action={submitChecklistAnswers} className="space-y-3">
                <input type="hidden" name="submissionId" value={sub.id} />
                <input type="hidden" name="code" value={project.code} />
                {questions.map((q) => {
                  const existing = sub.answers.find((a) => a.questionId === q.id);
                  return (
                    <div key={q.id} className="grid gap-1">
                      <input type="hidden" name="questionId" value={q.id} />
                      <label className="text-xs text-muted-foreground">
                        {q.order}. {q.text}
                      </label>
                      <Textarea
                        name={`answer_${q.id}`}
                        defaultValue={existing?.answer ?? ""}
                        rows={2}
                      />
                    </div>
                  );
                })}
                <Button type="submit" size="sm">
                  Save Answers
                </Button>
              </form>
            </div>
          ))}
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
