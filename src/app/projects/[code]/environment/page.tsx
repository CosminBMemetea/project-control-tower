import { notFound } from "next/navigation";
import { Save } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { updateProjectLinks } from "@/lib/actions";
import {
  STRUCTURE_HIERARCHY_ITEMS,
  EXECUTIVE_APPROVAL_LEVEL,
  EXECUTIVE_APPROVAL_LABEL,
  EXECUTIVE_APPROVAL_DESCRIPTION,
} from "@/lib/constants";
import { GoalProgressForm } from "@/components/goal-progress-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ControlledInput } from "@/components/controlled-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { StructureHierarchyCheckbox } from "@/components/structure-hierarchy-checkbox";
import { ManagerApprovalRow } from "@/components/manager-approval-row";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const LINK_FIELDS: { key: keyof LinkFields; label: string }[] = [
  { key: "gitRepoUrl", label: "Git Repository URL" },
  { key: "codebeamerUrl", label: "Requirements / Backlog Tool link" },
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
                <ControlledInput
                  id={field.key}
                  name={field.key}
                  defaultValue={project[field.key] ?? ""}
                  placeholder="https://..."
                />
              </div>
            ))}
            <Button type="submit" size="sm">
              <Save className="size-3.5" />
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
          <div className="space-y-3">
            {STRUCTURE_HIERARCHY_ITEMS.map((item) => (
              <label
                key={item.field}
                className="flex items-center gap-2 text-sm"
              >
                <StructureHierarchyCheckbox
                  projectId={project.id}
                  code={project.code}
                  field={item.field}
                  checked={project[item.field]}
                />
                {item.label}
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Saved automatically as you check each item.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {EXECUTIVE_APPROVAL_LEVEL}% — {EXECUTIVE_APPROVAL_LABEL}
          </CardTitle>
          <Badge variant={allApproved ? "default" : "outline"}>
            {allApproved ? "Fully approved" : "Pending approval"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {EXECUTIVE_APPROVAL_DESCRIPTION}.
          </p>
          {project.managerApprovals.map((approval) => (
            <ManagerApprovalRow
              key={approval.id}
              id={approval.id}
              code={project.code}
              managerName={approval.managerName}
              approved={approval.approved}
              approvedAt={approval.approvedAt}
              comment={approval.comment}
            />
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
