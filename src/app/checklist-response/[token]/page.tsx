import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { submitChecklistResponse } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ChecklistResponsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const submission = await prisma.checklistSubmission.findUnique({
    where: { token },
    include: { project: true, answers: true },
  });
  if (!submission) notFound();

  const questions = await prisma.checklistQuestion.findMany({
    orderBy: { order: "asc" },
  });
  const answerByQuestion = new Map(
    submission.answers.map((a) => [a.questionId, a.answer])
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 space-y-6">
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          Reporting Checklist
        </div>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          {submission.project.name}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Requested for {submission.recipientEmail}. Answer what you can —
          you can come back and update this later using the same link.
        </p>
        {submission.submittedAt && (
          <Badge variant="default" className="mt-3">
            Last submitted{" "}
            {new Date(submission.submittedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Badge>
        )}
      </div>

      <ActionForm action={submitChecklistResponse} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        {questions.map((q) => (
          <Card key={q.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {q.order}. {q.text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input type="hidden" name="questionId" value={q.id} />
              <Textarea
                name={`answer_${q.id}`}
                defaultValue={answerByQuestion.get(q.id) ?? ""}
                rows={3}
              />
            </CardContent>
          </Card>
        ))}
        <Button type="submit">Submit Response</Button>
      </ActionForm>
    </div>
  );
}
