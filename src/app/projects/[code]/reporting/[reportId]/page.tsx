import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/period";
import { reportLabel, isOffCadenceWeekly } from "@/lib/report-helpers";
import { deleteReport } from "@/lib/actions";
import { ReportTypeBadge } from "@/components/report-type-badge";
import {
  ReportMetaEditor,
  ReportSectionCard,
} from "@/components/report-section-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function ReportEditPage({
  params,
}: {
  params: Promise<{ code: string; reportId: string }>;
}) {
  const { code, reportId } = await params;

  const project = await prisma.project.findUnique({ where: { code } });
  if (!project) notFound();

  const report = await prisma.report.findFirst({
    where: { id: reportId, projectId: project.id },
    include: { sections: true },
  });
  if (!report) notFound();

  const sections = await prisma.reportTemplateSection.findMany({
    orderBy: { order: "asc" },
  });
  const entryBySection = new Map(report.sections.map((e) => [e.sectionId, e]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/projects/${project.code}/reporting`}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Back to Reporting
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">
            {reportLabel(
              report.type,
              new Date(report.reportDate),
              report.title
            )}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            {isOffCadenceWeekly(report.type, new Date(report.reportDate)) && (
              <Badge variant="outline">off-cadence</Badge>
            )}
            <ReportTypeBadge type={report.type} />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <ReportMetaEditor
            reportId={report.id}
            code={project.code}
            type={report.type}
            reportDate={toDateInputValue(new Date(report.reportDate))}
            title={report.title}
          />
          <p className="text-xs text-muted-foreground">
            Details and sections save automatically as you edit.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {sections.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No report template sections defined yet.{" "}
              <Link href="/report-template" className="underline">
                Set up the template
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          sections.map((section) => {
            const entry = entryBySection.get(section.id);
            return (
              <ReportSectionCard
                key={section.id}
                reportId={report.id}
                code={project.code}
                sectionId={section.id}
                label={section.label}
                hasLinks={section.hasLinks}
                content={entry?.content ?? null}
                links={entry?.links ?? null}
              />
            );
          })
        )}
      </div>

      <Separator />

      <form action={deleteReport}>
        <input type="hidden" name="id" value={report.id} />
        <input type="hidden" name="code" value={project.code} />
        <Button type="submit" variant="destructive" size="sm">
          <Trash2 className="size-3.5" />
          Delete Report
        </Button>
      </form>
    </div>
  );
}
