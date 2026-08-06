import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MonitoringCheckbox } from "@/components/monitoring-checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MonitoringPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [project, questions] = await Promise.all([
    prisma.project.findUnique({
      where: { code },
      include: { monitoringResponses: true },
    }),
    prisma.monitoringQuestion.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!project) notFound();

  const responseByQuestion = new Map(
    project.monitoringResponses.map((r) => [r.questionId, r.checked])
  );
  const checkedCount = questions.filter(
    (q) => responseByQuestion.get(q.id) === true
  ).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Monitoring</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Internal self-check per project — saved automatically, never
              emailed.
            </p>
          </div>
          <Badge variant={checkedCount === questions.length ? "default" : "outline"}>
            {checkedCount}/{questions.length}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q) => (
            <label key={q.id} className="flex items-start gap-2.5 text-sm">
              <MonitoringCheckbox
                projectId={project.id}
                code={project.code}
                questionId={q.id}
                checked={responseByQuestion.get(q.id) ?? false}
              />
              <span>{q.text}</span>
            </label>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
