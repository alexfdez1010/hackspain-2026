import {
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';
import { formatMonth, formatMonthShort } from '@/lib/xray/format';
import { scoreColor } from '@/lib/xray/score';

const BOX: ChartBox = {
  width: 720,
  height: 250,
  padLeft: 28,
  padRight: 12,
  padTop: 12,
  padBottom: 26,
};

const GUIDES = [35, 50, 65];

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
 * history.
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

  const placed = points.map((point, index) => ({
    ...point,
    x: xAt(index, count, BOX),
    y: point.value === null ? null : yAt(point.value, 0, 100, BOX),
  }));
  const observed = placed
    .slice(0, boundaryIndex + 1)
    .filter((point): point is (typeof placed)[number] & { y: number } =>
      Number.isFinite(point.y),
    );
  const projected = placed
    .slice(boundaryIndex)
    .filter((point): point is (typeof placed)[number] & { y: number } =>
      Number.isFinite(point.y),
    );
  const banded = placed.filter(
    (point) => point.p10 !== null && point.p90 !== null,
  );
  const bandPath =
    banded.length > 1
      ? `${linePath(
          banded.map((point) => ({
            x: point.x,
            y: yAt(point.p90 as number, 0, 100, BOX),
          })),
        )} ${banded
          .slice()
          .reverse()
          .map(
            (point) => `L${point.x} ${yAt(point.p10 as number, 0, 100, BOX)}`,
          )
          .join(' ')} Z`
      : '';

  const last = placed[count - 1];
  const boundary = placed[boundaryIndex];
  const stroke = scoreColor(boundary.value);
  const forecastStroke = scoreColor(last.value);

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-56 w-full sm:h-64"
        role="img"
        aria-label={`PULSE mensual desde ${formatMonth(points[0].month)} hasta ${formatMonth(boundary.month)} y previsión hasta ${formatMonth(last.month)}`}
      >
        {GUIDES.map((guide) => (
          <g key={guide}>
            <line
              x1={BOX.padLeft}
              x2={BOX.width - BOX.padRight}
              y1={yAt(guide, 0, 100, BOX)}
              y2={yAt(guide, 0, 100, BOX)}
              stroke="var(--separator)"
              strokeWidth={1}
            />
            <text
              x={0}
              y={yAt(guide, 0, 100, BOX) + 3}
              className="fill-muted text-[10px]"
            >
              {guide}
            </text>
          </g>
        ))}

        {bandPath && (
          <path d={bandPath} fill={forecastStroke} fillOpacity={0.16} />
        )}

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
          y={BOX.padTop + 9}
          className="fill-muted text-[10px]"
        >
          previsión
        </text>

        {boundary.y !== null && (
          <circle cx={boundary.x} cy={boundary.y} r={3.6} fill={stroke} />
        )}
        {last.y !== null && (
          <circle cx={last.x} cy={last.y} r={3.2} fill={forecastStroke} />
        )}

        {placed.map((point, index) =>
          index % 3 === 0 || index === count - 1 ? (
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
