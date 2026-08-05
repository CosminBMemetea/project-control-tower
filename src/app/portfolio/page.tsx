import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GOAL_TYPES, GOAL_SHORT_LABELS } from "@/lib/constants";
import { currentQuarter } from "@/lib/period";
import { GoalBadge } from "@/components/goal-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PortfolioPage() {
  const projects = await prisma.project.findMany({
    include: {
      goalProgress: true,
      quarterPresentations: true,
      teamsMeetings: true,
      managerApprovals: true,
    },
    orderBy: { name: "asc" },
  });

  const quarter = currentQuarter();

  const missing = projects.flatMap((p) => {
    const issues: string[] = [];
    if (!p.quarterPresentations.some((qp) => qp.quarter === quarter)) {
      issues.push(`Missing ${quarter} planning presentation`);
    }
    const coreMeetingTypes = ["WEEKLY", "SPRINT_REVIEW", "RETRO"];
    const missingMeetings = coreMeetingTypes.filter(
      (t) => !p.teamsMeetings.some((m) => m.type === t)
    );
    if (missingMeetings.length > 0) {
      issues.push(`Missing meeting link(s): ${missingMeetings.join(", ")}`);
    }
    if (!p.managerApprovals.every((a) => a.approved)) {
      issues.push("120% approval incomplete");
    }
    return issues.map((issue) => ({ project: p, issue }));
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Portfolio Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Coverage across the 6 goal tracks for every R&I project · current
          period {quarter}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Projects vs. Goal Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  {GOAL_TYPES.map((g) => (
                    <TableHead key={g} className="text-center whitespace-nowrap">
                      {GOAL_SHORT_LABELS[g]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${project.code}`}
                        className="hover:underline"
                      >
                        {project.name}
                      </Link>
                    </TableCell>
                    {GOAL_TYPES.map((g) => {
                      const gp = project.goalProgress.find(
                        (x) => x.goalType === g
                      );
                      return (
                        <TableCell key={g} className="text-center">
                          <GoalBadge level={gp?.level ?? 0} />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Missing Items</CardTitle>
        </CardHeader>
        <CardContent>
          {missing.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing outstanding — every project is fully covered.
            </p>
          ) : (
            <ul className="space-y-2">
              {missing.map((m, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0"
                >
                  <span>
                    <Link
                      href={`/projects/${m.project.code}`}
                      className="font-medium hover:underline"
                    >
                      {m.project.name}
                    </Link>{" "}
                    <span className="text-muted-foreground">— {m.issue}</span>
                  </span>
                  <Badge variant="outline">action needed</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
