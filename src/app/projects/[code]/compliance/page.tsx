import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addComplianceCheck, toggleComplianceCompliant } from "@/lib/actions";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ControlledCheckbox } from "@/components/controlled-checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function CompliancePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      complianceChecks: { orderBy: { checkedAt: "desc" } },
      goalProgress: { where: { goalType: "EXECUTION_ASSURANCE" } },
    },
  });

  if (!project) notFound();

  const goal = project.goalProgress[0];
  const deviations = project.complianceChecks.filter((c) => !c.compliant);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Execution Assurance (RUN)</CardTitle>
          <Badge variant={deviations.length === 0 ? "default" : "outline"}>
            {deviations.length === 0
              ? "No open deviations"
              : `${deviations.length} deviation(s)`}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {project.complianceChecks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No compliance checks logged yet.
              </p>
            )}
            {project.complianceChecks.map((c) => (
              <div
                key={c.id}
                className="flex items-start justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
              >
                <div className="text-sm">
                  <div className="font-medium">{c.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.checkedAt).toLocaleDateString()}
                    {c.deviationNote ? ` — ${c.deviationNote}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={c.compliant ? "default" : "destructive"}>
                    {c.compliant ? "Compliant" : "Deviation"}
                  </Badge>
                  <form action={toggleComplianceCompliant}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="code" value={project.code} />
                    <Button type="submit" size="sm" variant="ghost">
                      Toggle
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>

          <form
            action={addComplianceCheck}
            className="space-y-3 pt-2 border-t"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <Input name="description" placeholder="Compliance check description" />
            <Input name="deviationNote" placeholder="Deviation note (optional)" />
            <label className="flex items-center gap-2 text-sm">
              <ControlledCheckbox name="compliant" checked />
              Compliant
            </label>
            <Button type="submit" size="sm">
              Log Check
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {goal && (
        <GoalProgressForm
          projectId={project.id}
          code={project.code}
          goalType="EXECUTION_ASSURANCE"
          level={goal.level}
          evidenceUrl={goal.evidenceUrl}
        />
      )}
    </div>
  );
}
