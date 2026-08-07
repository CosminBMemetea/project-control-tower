import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EXECUTIVE_APPROVAL_LEVEL, EXECUTIVE_APPROVAL_LABEL } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManagerApprovalRow } from "@/components/manager-approval-row";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";

export default async function ApprovalsPage() {
  const projects = await prisma.project.findMany({
    include: { managerApprovals: { orderBy: { managerName: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Approvals — {EXECUTIVE_APPROVAL_LEVEL}% {EXECUTIVE_APPROVAL_LABEL}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full alignment requires sign-off from every configured approver per
          project.
        </p>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState icon={ShieldCheck} title="No projects yet" />
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
