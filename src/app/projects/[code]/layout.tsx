import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectTabs } from "@/components/project-tabs";
import { RagStatusControl } from "@/components/rag-status-control";
import { FteInput } from "@/components/fte-input";
import { ProjectNameInput } from "@/components/project-name-input";
import { Badge } from "@/components/ui/badge";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: { risks: { where: { status: { not: "CLOSED" } } } },
  });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <ProjectNameInput
            projectId={project.id}
            code={project.code}
            name={project.name}
          />
          <Badge variant="secondary">{project.status}</Badge>
          <RagStatusControl
            projectId={project.id}
            code={project.code}
            status={project.ragStatus}
            comment={project.ragComment}
            size="lg"
          />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <span>{project.code}</span>
          <span className="flex items-center gap-1.5">
            Allocated FTE
            <FteInput
              projectId={project.id}
              code={project.code}
              value={project.allocatedFte}
              compact
            />
          </span>
          {project.risks.length > 0 && (
            <Link
              href={`/projects/${project.code}/risks`}
              className="hover:underline"
            >
              <Badge variant="outline">{project.risks.length} open risk(s)</Badge>
            </Link>
          )}
        </div>
      </div>
      <ProjectTabs code={project.code} />
      <div>{children}</div>
    </div>
  );
}
