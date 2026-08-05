import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { GOAL_TYPES } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoalBadge } from "@/components/goal-badge";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { goalProgress: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {projects.length} R&I projects
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projects.map((project) => {
          const avg = Math.round(
            project.goalProgress.reduce((sum, g) => sum + g.level, 0) /
              (GOAL_TYPES.length || 1)
          );
          return (
            <Link key={project.id} href={`/projects/${project.code}`}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{project.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {project.code}
                      </div>
                    </div>
                    <Badge variant="secondary">{project.status}</Badge>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Average coverage
                    </span>
                    <GoalBadge level={avg} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
