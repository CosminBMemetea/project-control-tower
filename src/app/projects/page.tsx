import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createProject } from "@/lib/actions";
import {
  GOAL_TYPES,
  PROJECT_STATUSES,
  PROJECT_STATUS_EMOJI,
  PROJECT_STATUS_LABELS,
  isTrackedProjectStatus,
  toProjectStatus,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ActionForm } from "@/components/action-form";
import { GoalBadge } from "@/components/goal-badge";
import {
  ProjectStatusBadge,
  ProjectStatusSummary,
} from "@/components/project-status-badge";
import { EmptyState } from "@/components/empty-state";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { goalProgress: true },
    orderBy: { name: "asc" },
  });
  // In-flight projects first, then on hold / closed / cancelled — each
  // group in lifecycle order (Closing sits after On Hold in the lifecycle,
  // but it's still in flight). Stable, so name order holds within a status.
  const rank = (status: string) =>
    (isTrackedProjectStatus(status) ? 0 : PROJECT_STATUSES.length) +
    PROJECT_STATUSES.indexOf(toProjectStatus(status));
  projects.sort((a, b) => rank(a.status) - rank(b.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {projects.length} project{projects.length === 1 ? "" : "s"}
          {projects.length > 0 && (
            <>
              {" · "}
              <ProjectStatusSummary projects={projects} />
            </>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createProject}
            className="flex flex-wrap items-end gap-3"
            successMessage="Project created"
          >
            <div className="grid gap-1.5 flex-1 min-w-48">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input name="name" placeholder="e.g. Data Platform" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">
                Short code (used in links)
              </label>
              <Input
                name="code"
                placeholder="From name if blank"
                maxLength={32}
                className="w-44 font-mono uppercase placeholder:normal-case placeholder:font-sans"
              />
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                name="status"
                defaultValue="ACTIVE"
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_EMOJI[s]} {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" size="sm">
              <Plus className="size-3.5" />
              Create Project
            </Button>
          </ActionForm>
        </CardContent>
      </Card>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first one above."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project) => {
            const avg = Math.round(
              project.goalProgress.reduce((sum, g) => sum + g.level, 0) /
                (GOAL_TYPES.length || 1)
            );
            return (
              <Link key={project.id} href={`/projects/${project.code}`}>
                <Card
                  className={cn(
                    "hover:border-primary/50 transition-colors h-full",
                    !isTrackedProjectStatus(project.status) && "opacity-60"
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">{project.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {project.code}
                        </div>
                      </div>
                      <ProjectStatusBadge status={project.status} />
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
      )}
    </div>
  );
}
