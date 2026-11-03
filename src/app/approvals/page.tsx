import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { addApprover, removeApprover } from "@/lib/actions";
import {
  EXECUTIVE_APPROVAL_LABEL,
  TRACKED_PROJECT_STATUSES,
} from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagerApprovalRow } from "@/components/manager-approval-row";
import { ApproverNameInput } from "@/components/approver-name-input";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { ActionForm } from "@/components/action-form";
import { ControlledInput } from "@/components/controlled-input";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ApprovalsPage() {
  // Sign-off only matters while a project is in flight — on hold,
  // closed, and cancelled projects would otherwise sit here as "Pending"
  // forever.
  const [approvers, projects] = await Promise.all([
    prisma.approver.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({
      where: { status: { in: TRACKED_PROJECT_STATUSES } },
      include: { managerApprovals: { orderBy: { managerName: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Approvals — {EXECUTIVE_APPROVAL_LABEL}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full alignment requires sign-off from every approver below, per
          in-flight project.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approvers</CardTitle>
          <p className="text-xs text-muted-foreground">
            Everyone listed here signs off on every project. Renaming keeps
            their existing sign-offs; removing deletes them.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvers.length === 0 && (
            <EmptyState
              icon={ShieldCheck}
              title="No approvers yet"
              description="Add the people who sign off on projects."
            />
          )}
          {approvers.map((approver) => (
            <div
              key={approver.id}
              className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
            >
              <ApproverNameInput id={approver.id} name={approver.name} />
              <ConfirmActionButton
                action={removeApprover}
                fields={{ id: approver.id }}
                triggerLabel="Remove"
                title={`Remove ${approver.name}?`}
                description={`Their sign-off and comment on every project are deleted too. This can't be undone.`}
                confirmLabel="Remove approver"
              />
            </div>
          ))}

          <ActionForm
            action={addApprover}
            className="flex flex-wrap items-center gap-3 pt-2 border-t"
            successMessage="Approver added"
          >
            <ControlledInput
              name="name"
              placeholder="Approver name"
              defaultValue=""
              className="w-56"
            />
            <Button type="submit" size="sm">
              <Plus className="size-3.5" />
              Add Approver
            </Button>
          </ActionForm>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState icon={ShieldCheck} title="No in-flight projects" />
          </CardContent>
        </Card>
      ) : (
        approvers.length > 0 && (
          <div className="space-y-4">
            {projects.map((project) => {
              const allApproved =
                project.managerApprovals.length > 0 &&
                project.managerApprovals.every((a) => a.approved);
              return (
                <Card key={project.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">
                      <Link
                        href={`/projects/${project.code}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </CardTitle>
                    <Badge variant={allApproved ? "default" : "outline"}>
                      {allApproved ? "Fully approved" : "Pending"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
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
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
