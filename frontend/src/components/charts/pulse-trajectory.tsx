import {
  bandPath,
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import { ScoreGuides } from '@/components/charts/score-guides';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';
import { formatMonth, formatMonthShort, formatNumber } from '@/lib/format';
import { scoreColor } from '@/lib/score';

const BOX: ChartBox = {
  width: 720,
  height: 264,
  padLeft: 28,
  padRight: 34,
  padTop: 22,
  padBottom: 28,
};

/** A trajectory point already placed in viewBox coordinates. */
type PlacedPoint = PulseTrajectoryPoint & { x: number; y: number | null };

/**
 * Decides how often a month label fits without overlapping its neighbour.
 *
 * @param count - Number of points on the axis.
 * @returns The index step between printed labels; `1` labels every month.
 */
function labelStep(count: number): number {
  return Math.max(1, Math.ceil(count / 15));
}

/**
 * Places the points and keeps only those with a drawable value.
 *
 * @param points - Points to place, in reading order.
 * @returns The placed points that carry a finite y coordinate.
 */
function drawable(points: readonly PlacedPoint[]) {
  return points.filter(
    (point): point is PlacedPoint & { y: number } => point.y !== null,
  );
}

interface PulseTrajectoryChartProps {
  /** Observed months followed by the forecast horizons. */
  points: readonly PulseTrajectoryPoint[];
  /** Index of the last observed month; `-1` when there is no history. */
  boundaryIndex: number;
}

/**
 * Draws the monthly PULSE history and the six-month forecast on one axis.
 *
 * The observed line is solid and the forecast dashed, separated by the vertical
 * mark at the last closed month; the shaded area is the 80 % band (p10-p90), so
 * the reader sees the prediction and its uncertainty at the same scale as the
 * history. The last close and the farthest horizon are printed next to their
 * point, because those two numbers are the ones quoted in a committee.
 *
 * @param props - The merged trajectory and its boundary.
 * @returns An inline SVG chart, or an empty state when there is no history.
 */
export function PulseTrajectoryChart({
  points,
  boundaryIndex,
}: PulseTrajectoryChartProps) {
  const count = points.length;
  if (count === 0 || boundaryIndex < 0) {
    return <p className="text-sm text-muted">Sin historial mensual.</p>;
  }

  const placed: PlacedPoint[] = points.map((point, index) => ({
    ...point,
    x: xAt(index, count, BOX),
    y: point.value === null ? null : yAt(point.value, 0, 100, BOX),
  }));
  const observed = drawable(placed.slice(0, boundaryIndex + 1));
  const projected = drawable(placed.slice(boundaryIndex));
  const banded = placed.filter(
    (point): point is PlacedPoint & { p10: number; p90: number } =>
      point.p10 !== null && point.p90 !== null,
  );
  const band = bandPath(
    banded.map((point) => ({ x: point.x, y: yAt(point.p90, 0, 100, BOX) })),
    banded.map((point) => ({ x: point.x, y: yAt(point.p10, 0, 100, BOX) })),
  );

  const last = placed[count - 1];
  const boundary = placed[boundaryIndex];
  const stroke = scoreColor(boundary.value);
  const forecastStroke = scoreColor(last.value);
  const step = labelStep(count);

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-56 w-full sm:h-72 lg:h-80"
        role="img"
        aria-label={`PULSE mensual desde ${formatMonth(points[0].month)} hasta ${formatMonth(boundary.month)} y previsión hasta ${formatMonth(last.month)}`}
      >
        <ScoreGuides box={BOX} />

        {band && <path d={band} fill={forecastStroke} fillOpacity={0.16} />}

        <path
          d={linePath(observed)}
          fill="none"
          stroke={stroke}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={linePath(projected)}
          fill="none"
          stroke={forecastStroke}
          strokeWidth={2}
          strokeDasharray="6 4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <line
          x1={boundary.x}
          x2={boundary.x}
          y1={BOX.padTop}
          y2={BOX.height - BOX.padBottom}
          stroke="var(--foreground)"
          strokeWidth={1.2}
          strokeDasharray="3 3"
          opacity={0.45}
        />
        <text
          x={boundary.x + 4}
          y={BOX.padTop - 8}
          className="fill-muted text-[10px]"
        >
          previsión
        </text>

        {boundary.y !== null && (
          <g>
            <circle cx={boundary.x} cy={boundary.y} r={3.6} fill={stroke} />
            <text
              x={boundary.x - 6}
              y={boundary.y - 9}
              textAnchor="end"
              className="text-[11px] font-medium tabular-nums"
              fill={stroke}
            >
              {formatNumber(boundary.value, 1)}
            </text>
          </g>
        )}
        {last.y !== null && boundaryIndex < count - 1 && (
          <g>
            <circle cx={last.x} cy={last.y} r={3.2} fill={forecastStroke} />
            <text
              x={last.x}
              y={last.y - 9}
              textAnchor="end"
              className="text-[11px] font-medium tabular-nums"
              fill={forecastStroke}
            >
              {formatNumber(last.value, 1)}
            </text>
          </g>
        )}

        {placed.map((point, index) =>
          index % step === 0 ||
          index === count - 1 ||
          index === boundaryIndex ? (
            <text
              key={`label-${point.month}`}
              x={point.x}
              y={BOX.height - 8}
              textAnchor="middle"
              className="fill-muted text-[10px]"
            >
              {formatMonthShort(point.month)}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>Línea continua: PULSE observado.</span>
        <span>Discontinua: previsión +1 a +6 meses.</span>
        <span>Área: banda p10-p90.</span>
      </figcaption>
    </figure>
  );
}
