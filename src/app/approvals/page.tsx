import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { setManagerApproval } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
          Approvals — 120% Business Innovation Process
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full alignment requires sign-off from all three senior managers per
          project.
        </p>
      </div>

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
                  <form
                    key={approval.id}
                    action={setManagerApproval}
                    className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <input type="hidden" name="id" value={approval.id} />
                    <input type="hidden" name="code" value={project.code} />
                    <label className="flex items-center gap-2 w-44 shrink-0 text-sm font-medium">
                      <Checkbox
                        name="approved"
                        defaultChecked={approval.approved}
                      />
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
          );
        })}
      </div>
    </div>
  );
}
