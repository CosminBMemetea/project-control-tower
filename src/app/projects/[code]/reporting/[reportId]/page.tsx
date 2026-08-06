import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/period";
import { REPORT_TYPES, REPORT_TYPE_LABELS } from "@/lib/constants";
import { reportLabel } from "@/lib/report-helpers";
import { updateReportMeta, saveReportSections, deleteReport } from "@/lib/actions";
import { ReportTypeBadge } from "@/components/report-type-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ControlledInput } from "@/components/controlled-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function parseLinks(raw: string | null): { url: string; isLink: boolean }[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ url: line, isLink: /^https?:\/\//i.test(line) }));
}

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
            {reportLabel(report.type, new Date(report.reportDate), report.title)}
          </CardTitle>
          <ReportTypeBadge type={report.type} />
        </CardHeader>
        <CardContent>
          <form action={updateReportMeta} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={report.id} />
            <input type="hidden" name="code" value={project.code} />
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                name="type"
                defaultValue={report.type}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {REPORT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-xs text-muted-foreground">Date</label>
              <ControlledInput
                type="date"
                name="reportDate"
                defaultValue={toDateInputValue(new Date(report.reportDate))}
                className="w-40"
              />
            </div>
            <div className="grid gap-1.5 flex-1 min-w-48">
              <label className="text-xs text-muted-foreground">
                Title (optional)
              </label>
              <ControlledInput name="title" defaultValue={report.title ?? ""} />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Save Details
            </Button>
          </form>
        </CardContent>
      </Card>

      <form action={saveReportSections} className="space-y-6">
        <input type="hidden" name="reportId" value={report.id} />
        <input type="hidden" name="code" value={project.code} />

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
            const existingLinks = parseLinks(entry?.links ?? null);
            return (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-base">{section.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input type="hidden" name="sectionId" value={section.id} />
                  <Textarea
                    name={`content_${section.id}`}
                    defaultValue={entry?.content ?? ""}
                    rows={4}
                    placeholder={`Write ${section.label.toLowerCase()}...`}
                  />
                  {section.hasLinks && (
                    <div className="space-y-2">
                      {existingLinks.length > 0 && (
                        <ul className="space-y-1">
                          {existingLinks.map((l, i) =>
                            l.isLink ? (
                              <li key={i}>
                                <a
                                  href={l.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary underline"
                                >
                                  {l.url}
                                </a>
                              </li>
                            ) : (
                              <li key={i} className="text-xs text-muted-foreground">
                                {l.url}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                      <Textarea
                        name={`links_${section.id}`}
                        defaultValue={entry?.links ?? ""}
                        rows={3}
                        placeholder="One link per line, e.g. https://codebeamer.example/item/1234"
                        className="text-xs"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}

        {sections.length > 0 && (
          <Button type="submit">Save Report</Button>
        )}
      </form>

      <Separator />

      <form action={deleteReport}>
        <input type="hidden" name="id" value={report.id} />
        <input type="hidden" name="code" value={project.code} />
        <Button type="submit" variant="destructive" size="sm">
          Delete Report
        </Button>
      </form>
    </div>
  );
}
