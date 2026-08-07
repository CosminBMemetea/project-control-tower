import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HEALTH_DIMENSIONS, HEALTH_DIMENSION_LABELS, HEALTH_TIER_COLORS, healthTier } from "@/lib/constants";
import { computeHealthStats } from "@/lib/health";
import { RadarChart } from "@/components/radar-chart";
import { HealthDimensionRow } from "@/components/health-dimension-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function HealthPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await prisma.project.findUnique({
    where: { code },
    include: { healthScores: true },
  });

  if (!project) notFound();

  const stats = computeHealthStats(project.healthScores);
  const tier = healthTier(stats.average);
  const commentByDimension = new Map(
    project.healthScores.map((h) => [h.dimension, h.comment])
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Project Health — Spider Web</CardTitle>
          <span
            className={cn(
              "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tabular-nums",
              HEALTH_TIER_COLORS[tier]
            )}
          >
            Average {stats.average.toFixed(1)} / 5
          </span>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <RadarChart scores={stats.values} size={320} />
          {stats.spread >= 3 && (
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Unbalanced — {HEALTH_DIMENSION_LABELS[stats.minDimension]} ({stats.min}) is well
              below the other dimensions. A wide spread is often a bigger problem than a low
              average.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scores & Notes</CardTitle>
          <p className="text-xs text-muted-foreground">
            1 = Critical, 5 = Excellent. Update any dimension any time — each saves
            independently.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {HEALTH_DIMENSIONS.map((d) => (
            <HealthDimensionRow
              key={d}
              projectId={project.id}
              code={project.code}
              dimension={d}
              score={stats.values[d]}
              comment={commentByDimension.get(d) ?? null}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
