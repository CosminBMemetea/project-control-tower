import { HEALTH_DIMENSIONS, HEALTH_DEFAULT_SCORE, type HealthDimension } from "@/lib/constants";

export type HealthStats = {
  values: Record<HealthDimension, number>;
  average: number;
  min: number;
  max: number;
  spread: number;
  minDimension: HealthDimension;
};

// Builds the full 6-value score map (defaulting any unscored dimension to
// neutral) plus the derived numbers used for both the radar chart and the
// portfolio-wide "out of shape" signals: a low average, or a wide spread
// between the strongest and weakest dimension.
export function computeHealthStats(
  scores: { dimension: string; score: number }[]
): HealthStats {
  const byDimension = new Map(scores.map((s) => [s.dimension, s.score]));
  const values = Object.fromEntries(
    HEALTH_DIMENSIONS.map((d) => [d, byDimension.get(d) ?? HEALTH_DEFAULT_SCORE])
  ) as Record<HealthDimension, number>;

  const entries = HEALTH_DIMENSIONS.map((d) => ({ d, v: values[d] }));
  const average = entries.reduce((sum, x) => sum + x.v, 0) / entries.length;
  const min = Math.min(...entries.map((x) => x.v));
  const max = Math.max(...entries.map((x) => x.v));
  const minDimension = entries.find((x) => x.v === min)!.d;

  return { values, average, min, max, spread: max - min, minDimension };
}
