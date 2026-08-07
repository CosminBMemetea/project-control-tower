import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentMonth } from "@/lib/period";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function MonthlySummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = monthParam || currentMonth();

  const projects = await prisma.project.findMany({
    include: {
      reports: {
        where: { type: "END_MONTH" },
        include: { sections: { include: { section: true } } },
        orderBy: { reportDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const withReport = projects
    .map((p) => ({
      project: p,
      report: p.reports.find((r) => {
        const d = new Date(r.reportDate);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
        return key === month;
      }),
    }))
    .sort((a, b) => a.project.name.localeCompare(b.project.name));

  const covered = withReport.filter((x) => x.report).length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/portfolio"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          ← Back to Portfolio Overview
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Monthly Consolidated Summary
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            The full governance view — every project&apos;s end-month report,
            in one place.
          </p>
        </div>
        <form className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">Month</label>
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
          />
          <Button type="submit" size="sm" variant="outline">
            View
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Coverage for {month}
          </span>
          <Badge variant={covered === projects.length ? "default" : "outline"}>
            {covered}/{projects.length} projects reported
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {withReport.map(({ project, report }) => (
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
              {report ? (
                <Link href={`/projects/${project.code}/reporting/${report.id}`}>
                  <Button type="button" size="sm" variant="outline">
                    Open Report
                  </Button>
                </Link>
              ) : (
                <Badge variant="outline">No end-month report</Badge>
              )}
            </CardHeader>
            {report && (
              <CardContent className="space-y-3 text-sm">
                {report.sections
                  .filter((s) => s.content)
                  .map((s) => (
                    <div key={s.id}>
                      <div className="font-medium text-xs text-muted-foreground mb-0.5">
                        {s.section.label}
                      </div>
                      <p className="whitespace-pre-wrap">{s.content}</p>
                    </div>
                  ))}
                {report.sections.every((s) => !s.content) && (
                  <p className="text-muted-foreground">
                    Report created, sections not filled in yet.
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
