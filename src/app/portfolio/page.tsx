import Link from "next/link";
import { FolderKanban, AlertOctagon, ShieldAlert, Radar, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import {
  GOAL_TYPES,
  GOAL_SHORT_LABELS,
  GOAL_LEVELS,
  GOAL_LABELS,
  CORE_MEETING_TYPES,
  MEETING_TYPE_LABELS,
  isHighSeverity,
  healthTier,
  HEALTH_TIER_COLORS,
  HEALTH_DIMENSION_LABELS,
  HEALTH_WEAK_THRESHOLD,
  EXECUTIVE_APPROVAL_LABEL,
} from "@/lib/constants";
import { currentQuarter } from "@/lib/period";
import { computeMeetingStatus } from "@/lib/meeting-status";
import { computeChecklistStatus } from "@/lib/checklist-status";
import { computeHealthStats } from "@/lib/health";
import { GoalBadge } from "@/components/goal-badge";
import { GoalLevelSelect } from "@/components/goal-level-select";
import { RagStatusControl } from "@/components/rag-status-control";
import { FteInput } from "@/components/fte-input";
import { RadarChart } from "@/components/radar-chart";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
      checklistSubmissions: true,
      risks: true,
      healthScores: true,
    },
    orderBy: { name: "asc" },
  });

  const quarter = currentQuarter();
  const thresholds = GOAL_LEVELS.filter((l) => l > 0); // 25, 50, 75, 100, 120

  // How many projects have *reached* each threshold, per goal — levels are
  // cumulative (reaching 50% implies the 25% items are already covered),
  // so "reached 25%" counts every project at level >= 25.
  const coverageByGoal = GOAL_TYPES.map((goalType) => {
    const levels = projects.map(
      (p) => p.goalProgress.find((g) => g.goalType === goalType)?.level ?? 0
    );
    return {
      goalType,
      counts: thresholds.map(
        (threshold) => levels.filter((l) => l >= threshold).length
      ),
    };
  });

  const missing = projects.flatMap((p) => {
    const issues: string[] = [];
    if (!p.quarterPresentations.some((qp) => qp.quarter === quarter)) {
      issues.push(`Missing ${quarter} planning presentation`);
    }
    const meetingProblems = CORE_MEETING_TYPES.filter((t) => {
      const meeting = p.teamsMeetings.find((m) => m.type === t) ?? null;
      return computeMeetingStatus(meeting) !== "ACTIVE";
    });
    if (meetingProblems.length > 0) {
      issues.push(
        `Meeting map incomplete: ${meetingProblems
          .map((t) => MEETING_TYPE_LABELS[t])
          .join(", ")}`
      );
    }
    if (!p.managerApprovals.every((a) => a.approved)) {
      issues.push(`${EXECUTIVE_APPROVAL_LABEL} incomplete`);
    }
    if (computeChecklistStatus(p.checklistSubmissions) !== "ACTIVE") {
      issues.push("Reporting Checklist verification overdue");
    }
    const highSeverityRisks = p.risks.filter(
      (r) => r.status !== "CLOSED" && isHighSeverity(r)
    );
    if (highSeverityRisks.length > 0) {
      issues.push(
        `${highSeverityRisks.length} high-severity risk(s) open: ${highSeverityRisks
          .map((r) => r.title)
          .join(", ")}`
      );
    }
    const healthStats = computeHealthStats(p.healthScores);
    const weakDimensions = Object.entries(healthStats.values).filter(
      ([, v]) => v <= HEALTH_WEAK_THRESHOLD
    );
    if (weakDimensions.length > 0) {
      issues.push(
        `Weak health score(s): ${weakDimensions
          .map(([d, v]) => `${HEALTH_DIMENSION_LABELS[d as keyof typeof HEALTH_DIMENSION_LABELS]} (${v})`)
          .join(", ")}`
      );
    }
    return issues.map((issue) => ({ project: p, issue }));
  });

  // Rounded to the same 0.1 granularity as FteInput's step — summing raw
  // floats (e.g. 3.5 + 0.6 + 0.6) can otherwise land on something like
  // 4.699999999999999 and display that verbatim.
  const totalFte = Math.round(projects.reduce((sum, p) => sum + p.allocatedFte, 0) * 10) / 10;

  const riskSummary = projects
    .map((p) => {
      const open = p.risks.filter((r) => r.status !== "CLOSED");
      return {
        project: p,
        open: open.length,
        highSeverity: open.filter(isHighSeverity).length,
      };
    })
    .filter((r) => r.open > 0)
    .sort((a, b) => b.highSeverity - a.highSeverity || b.open - a.open);

  const healthSummary = projects
    .map((p) => ({ project: p, stats: computeHealthStats(p.healthScores) }))
    .sort((a, b) => a.stats.average - b.stats.average); // most out of shape first

  const redCount = projects.filter((p) => p.ragStatus === "RED").length;
  const totalOpenRisks = riskSummary.reduce((sum, r) => sum + r.open, 0);
  const totalHighSeverityRisks = riskSummary.reduce((sum, r) => sum + r.highSeverity, 0);
  const outOfShapeCount = healthSummary.filter(
    ({ stats }) => stats.spread >= 3 || healthTier(stats.average) === "CRITICAL"
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Portfolio Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Coverage across the 6 goal tracks for every project · current
            period {quarter}
          </p>
        </div>
        <Link href="/portfolio/monthly-summary">
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-muted px-3 py-1.5"
          >
            Monthly Consolidated Summary →
          </Badge>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={FolderKanban} label="Projects" value={projects.length} />
        <StatCard
          icon={AlertOctagon}
          label="Red RAG"
          value={redCount}
          tone={redCount > 0 ? "critical" : "good"}
        />
        <StatCard
          icon={ShieldAlert}
          label="Open risks"
          value={totalOpenRisks}
          sub={totalHighSeverityRisks > 0 ? `${totalHighSeverityRisks} high severity` : undefined}
          tone={totalHighSeverityRisks > 0 ? "critical" : totalOpenRisks > 0 ? "watch" : "good"}
        />
        <StatCard
          icon={Radar}
          label="Out of shape"
          value={outOfShapeCount}
          tone={outOfShapeCount > 0 ? "watch" : "good"}
        />
        <StatCard icon={Users} label="Total FTE" value={totalFte} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Projects vs. Goal Coverage
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Each level is set directly — pick it from the dropdown under any
            badge to update it, here or on the project&apos;s tab.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    RAG
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    FTE
                  </TableHead>
                  {GOAL_TYPES.map((g) => (
                    <TableHead key={g} className="text-center whitespace-nowrap">
                      {GOAL_SHORT_LABELS[g]}
                    </TableHead>
                  ))}
                  <TableHead className="text-center whitespace-nowrap">
                    Average
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects
                  .map((project) => {
                    const levels = GOAL_TYPES.map(
                      (g) =>
                        project.goalProgress.find((x) => x.goalType === g)
                          ?.level ?? 0
                    );
                    const average = Math.round(
                      levels.reduce((sum, l) => sum + l, 0) / levels.length
                    );
                    return { project, levels, average };
                  })
                  .sort((a, b) => a.average - b.average) // most behind first
                  .map(({ project, levels, average }) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link
                          href={`/projects/${project.code}`}
                          className="hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <RagStatusControl
                          projectId={project.id}
                          code={project.code}
                          status={project.ragStatus}
                          comment={project.ragComment}
                          compact
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <FteInput
                          projectId={project.id}
                          code={project.code}
                          value={project.allocatedFte}
                          compact
                        />
                      </TableCell>
                      {GOAL_TYPES.map((g, i) => (
                        <TableCell key={g} className="text-center">
                          <GoalLevelSelect
                            projectId={project.id}
                            code={project.code}
                            goalType={g}
                            level={levels[i]}
                            layout="stacked"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <GoalBadge level={average} />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-medium">
                    Total ({projects.length} projects)
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-center font-semibold tabular-nums">
                    {totalFte}
                  </TableCell>
                  {GOAL_TYPES.map((g) => (
                    <TableCell key={g} />
                  ))}
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Health</CardTitle>
          <p className="text-xs text-muted-foreground">
            Scope · Schedule · Cost · Risk · Quality · Resources, 1-5 each. A
            lopsided or small shape means a project is out of shape — weak or
            unbalanced on one or more dimensions. Sorted worst average first.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-center">Shape</TableHead>
                  <TableHead className="text-center">Average</TableHead>
                  <TableHead>Weakest Dimension</TableHead>
                  <TableHead className="text-center">Flag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {healthSummary.map(({ project, stats }) => {
                  const tier = healthTier(stats.average);
                  const unbalanced = stats.spread >= 3;
                  return (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link
                          href={`/projects/${project.code}/health`}
                          className="hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">
                        <RadarChart
                          scores={stats.values}
                          size={48}
                          compact
                          className="inline-block"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                            HEALTH_TIER_COLORS[tier]
                          )}
                        >
                          {stats.average.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {stats.spread === 0 ? (
                          <span className="text-muted-foreground">
                            Balanced ({stats.min})
                          </span>
                        ) : (
                          `${HEALTH_DIMENSION_LABELS[stats.minDimension]} (${stats.min})`
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {unbalanced ? (
                          <Badge variant="destructive">Unbalanced</Badge>
                        ) : tier === "CRITICAL" ? (
                          <Badge variant="destructive">Weak</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Portfolio Coverage per Goal
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Projects that have reached each milestone level, out of{" "}
            {projects.length} total (levels are cumulative — reaching 50%
            counts toward 25% too).
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  {thresholds.map((t) => (
                    <TableHead key={t} className="text-center">
                      {t}%
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {coverageByGoal.map(({ goalType, counts }) => (
                  <TableRow key={goalType}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {GOAL_LABELS[goalType]}
                    </TableCell>
                    {counts.map((count, i) => (
                      <TableCell key={thresholds[i]} className="text-center">
                        {count}/{projects.length}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Register Summary</CardTitle>
          <p className="text-xs text-muted-foreground">
            Open risks per project — high severity means both Impact and
            Probability are set to High.
          </p>
        </CardHeader>
        <CardContent>
          {riskSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No open risks across the portfolio.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="text-center">Open Risks</TableHead>
                    <TableHead className="text-center">
                      High Severity
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskSummary.map(({ project, open, highSeverity }) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link
                          href={`/projects/${project.code}/risks`}
                          className="hover:underline"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">{open}</TableCell>
                      <TableCell className="text-center">
                        {highSeverity > 0 ? (
                          <Badge variant="destructive">{highSeverity}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
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
