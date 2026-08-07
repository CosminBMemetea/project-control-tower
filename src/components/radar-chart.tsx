import {
  HEALTH_DIMENSIONS,
  HEALTH_DIMENSION_LABELS,
  HEALTH_SCORE_MAX,
  type HealthDimension,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

// Hand-rolled SVG radar/spider chart — no charting library needed for a
// fixed 6-axis shape. `compact` drops grid lines, axis lines, dots, and
// labels for use as a small-multiple in the Portfolio Overview, where the
// silhouette alone (lopsided vs. a full hexagon) is the signal.
export function RadarChart({
  scores,
  size = 260,
  compact = false,
  className,
}: {
  scores: Record<HealthDimension, number>;
  size?: number;
  compact?: boolean;
  className?: string;
}) {
  const n = HEALTH_DIMENSIONS.length;
  const cx = size / 2;
  const cy = size / 2;
  const labelPad = compact ? 0 : 30;
  const maxR = size / 2 - (compact ? 2 : labelPad);

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pointFor = (i: number, r: number): [number, number] => {
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const values = HEALTH_DIMENSIONS.map((d) =>
    Math.max(0, Math.min(HEALTH_SCORE_MAX, scores[d] ?? 0))
  );
  const dataPoints = values.map((v, i) => pointFor(i, (v / HEALTH_SCORE_MAX) * maxR));
  const dataPath =
    dataPoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    " Z";

  const rings = compact ? [] : [1, 2, 3, 4, 5];

  // Compact instances (Portfolio Overview) always sit next to plain-text
  // Average/Weakest columns that already say the same thing — announcing
  // all 6 dimensions again per row would just be screen-reader noise, so
  // those are decorative. The full chart is the primary way scores are
  // seen together, so it gets a real image role + label.
  const a11yProps = compact
    ? { "aria-hidden": true }
    : {
        role: "img" as const,
        "aria-label":
          "Health radar: " +
          HEALTH_DIMENSIONS.map((d, i) => `${HEALTH_DIMENSION_LABELS[d]} ${values[i]}`).join(", "),
      };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("max-w-full h-auto", className)}
      {...a11yProps}
    >
      <g className="text-border" stroke="currentColor" fill="none">
        {rings.map((level) => {
          const r = (level / HEALTH_SCORE_MAX) * maxR;
          const pts = HEALTH_DIMENSIONS.map((_, i) => pointFor(i, r).join(",")).join(" ");
          return <polygon key={level} points={pts} strokeWidth={1} />;
        })}
        {!compact &&
          HEALTH_DIMENSIONS.map((d, i) => {
            const [x, y] = pointFor(i, maxR);
            return <line key={d} x1={cx} y1={cy} x2={x} y2={y} strokeWidth={1} />;
          })}
      </g>

      <path
        d={dataPath}
        className="text-primary"
        fill="currentColor"
        fillOpacity={compact ? 0.35 : 0.22}
        stroke="currentColor"
        strokeWidth={compact ? 1.5 : 2}
      />
      {!compact &&
        dataPoints.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} className="text-primary" fill="currentColor" />
        ))}

      {!compact &&
        HEALTH_DIMENSIONS.map((d, i) => {
          const [x, y] = pointFor(i, maxR + 16);
          return (
            <text
              key={d}
              x={x}
              y={y}
              fontSize={11}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
            >
              {HEALTH_DIMENSION_LABELS[d]} ({values[i]})
            </text>
          );
        })}
    </svg>
  );
}
