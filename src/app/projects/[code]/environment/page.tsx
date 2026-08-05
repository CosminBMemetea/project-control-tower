import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  updateProjectLinks,
  setManagerApproval,
  updateStructureHierarchy,
} from "@/lib/actions";
import { STRUCTURE_HIERARCHY_ITEMS } from "@/lib/constants";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ControlledCheckbox } from "@/components/controlled-checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const LINK_FIELDS: { key: keyof LinkFields; label: string }[] = [
  { key: "gitRepoUrl", label: "Git Repository URL" },
  { key: "codebeamerUrl", label: "CodeBeamer Feature / Project link" },
  { key: "wowPresentationUrl", label: "Way of Working presentation" },
  { key: "envSetupDocUrl", label: "Environment Setup documentation" },
  { key: "onboardingGuideUrl", label: "Onboarding Guide" },
];

type LinkFields = {
  gitRepoUrl: string | null;
  codebeamerUrl: string | null;
  wowPresentationUrl: string | null;
  envSetupDocUrl: string | null;
  onboardingGuideUrl: string | null;
};

export default async function EnvironmentPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: {
      managerApprovals: { orderBy: { managerName: "asc" } },
      goalProgress: { where: { goalType: "ENVIRONMENT_SETUP" } },
    },
  });

  if (!project) notFound();

  const goal = project.goalProgress[0];
  const allApproved =
    project.managerApprovals.length > 0 &&
    project.managerApprovals.every((a) => a.approved);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Links & References</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProjectLinks} className="space-y-4">
            <input type="hidden" name="code" value={project.code} />
            {LINK_FIELDS.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  name={field.key}
                  defaultValue={project[field.key] ?? ""}
                  placeholder="https://..."
                />
              </div>
            ))}
            <Button type="submit" size="sm">
              Save Links
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Structure Hierarchy (visible in the UI)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Epics → per year · User Stories → per quarter · Tasks → per
            sprint · 4 Sprints per Quarter, each with a Sprint Goal
          </p>
          <form action={updateStructureHierarchy} className="space-y-3">
            <input type="hidden" name="projectId" value={project.id} />
            <input type="hidden" name="code" value={project.code} />
            {STRUCTURE_HIERARCHY_ITEMS.map((item) => (
              <label
                key={item.field}
                className="flex items-center gap-2 text-sm"
              >
                <ControlledCheckbox
                  name={item.field}
                  checked={project[item.field]}
                />
                {item.label}
              </label>
            ))}
            <Button type="submit" size="sm">
              Save Planning Status
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            120% — Full Alignment with Business Innovation Process
          </CardTitle>
          <Badge variant={allApproved ? "default" : "outline"}>
            {allApproved ? "Fully approved" : "Pending approval"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {project.managerApprovals.map((approval) => (
            <form
              key={approval.id}
              action={setManagerApproval}
              className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              <input type="hidden" name="id" value={approval.id} />
              <input type="hidden" name="code" value={project.code} />
              <label className="flex items-center gap-2 w-44 shrink-0 text-sm font-medium">
                <ControlledCheckbox name="approved" checked={approval.approved} />
                {approval.managerName}
              </label>
              <Input
                name="comment"
                placeholder="Optional comment"
                defaultValue={approval.comment ?? ""}
                className="flex-1 min-w-40"
              />
              <span className="text-xs text-muted-foreground w-32 shrink-0">
                {approval.approvedAt
                  ? new Date(approval.approvedAt).toLocaleDateString()
                  : "Not approved"}
              </span>
              <Button type="submit" size="sm" variant="outline">
                Save
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {goal && (
        <GoalProgressForm
          projectId={project.id}
          code={project.code}
          goalType="ENVIRONMENT_SETUP"
          level={goal.level}
          evidenceUrl={goal.evidenceUrl}
        />
      )}
    </div>
  );
}
