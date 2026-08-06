import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addQuarterPresentation, deleteQuarterPresentation } from "@/lib/actions";
import { currentQuarter } from "@/lib/period";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ControlledInput } from "@/components/controlled-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function PlanningPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      quarterPresentations: { orderBy: { quarter: "desc" } },
      goalProgress: { where: { goalType: "PLANNING_TRACKING" } },
    },
  });

  if (!project) notFound();

  const goal = project.goalProgress[0];
  const quarter = currentQuarter();
  const hasCurrentQuarter = project.quarterPresentations.some(
    (qp) => qp.quarter === quarter
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Quarter Presentations</CardTitle>
          <Badge variant={hasCurrentQuarter ? "default" : "outline"}>
            {hasCurrentQuarter ? `${quarter} present` : `${quarter} missing`}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {project.quarterPresentations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No quarter presentations linked yet.
              </p>
            )}
            {project.quarterPresentations.map((qp) => (
              <div
                key={qp.id}
                className="flex items-center justify-between gap-3 border-b pb-2 last:border-0 last:pb-0"
              >
                <div className="text-sm">
                  <span className="font-medium">{qp.quarter}</span>{" "}
                  <a
                    href={qp.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {qp.url}
                  </a>
                </div>
                <form action={deleteQuarterPresentation}>
                  <input type="hidden" name="id" value={qp.id} />
                  <input type="hidden" name="code" value={project.code} />
                  <Button type="submit" size="sm" variant="ghost">
                    Remove
                  </Button>
                </form>
              </div>
            ))}
          </div>

          <form
            action={addQuarterPresentation}
            className="flex flex-wrap items-end gap-3 pt-2 border-t"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Quarter</label>
              <ControlledInput
                name="quarter"
                placeholder={quarter}
                defaultValue={quarter}
                className="w-28"
              />
            </div>
            <div className="grid gap-1.5 flex-1 min-w-48">
              <label className="text-xs text-muted-foreground">
                Presentation URL
              </label>
              <Input name="url" placeholder="https://..." />
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
          goalType="PLANNING_TRACKING"
          level={goal.level}
          evidenceUrl={goal.evidenceUrl}
        />
      )}
    </div>
  );
}
