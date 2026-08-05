import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectTabs } from "@/components/project-tabs";
import { Badge } from "@/components/ui/badge";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({ where: { code } });

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
          <Badge variant="secondary">{project.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{project.code}</p>
      </div>
      <ProjectTabs code={project.code} />
      <div>{children}</div>
    </div>
  );
}
