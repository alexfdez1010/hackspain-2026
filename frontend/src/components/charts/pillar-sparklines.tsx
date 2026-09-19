import {
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import { ScoreGuides } from '@/components/charts/score-guides';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulsePillarSeries } from '@/lib/pulse/pillar-series';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';
import { scoreColor } from '@/lib/score';

const BOX: ChartBox = {
  width: 240,
  height: 68,
  padLeft: 3,
  padRight: 3,
  padTop: 6,
  padBottom: 6,
};

interface PillarSparklineProps {
  series: PulsePillarSeries;
}

/**
 * Draws the observed history of one pillar on the 0-100 score scale.
 *
 * Months with no pillar score are skipped instead of dropped to zero, and the
 * horizontal position still comes from the month index, so the four charts of
 * the set stay aligned month by month.
 *
 * @param props - The pillar series to draw.
 * @returns A labelled small multiple.
 */
function PillarSparkline({ series }: PillarSparklineProps) {
  const count = series.points.length;
  const drawn = series.points
    .map((point, index) => ({
      month: point.month,
      value: point.value,
      x: xAt(index, count, BOX),
    }))
    .filter(
      (point): point is { month: string; value: number; x: number } =>
        point.value !== null,
    )
    .map((point) => ({ ...point, y: yAt(point.value, 0, 100, BOX) }));
  const end = drawn[drawn.length - 1];
  const color = scoreColor(series.last);
  const first = series.points[0]?.month ?? '';

  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="flex items-baseline justify-between gap-2 text-sm">
        <span className="min-w-0 truncate">{series.label}</span>
        <span className="tabular-nums" style={{ color }}>
          {series.last === null ? UNKNOWN_TEXT : formatNumber(series.last, 1)}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-16 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${series.label}: ${series.last === null ? UNKNOWN_TEXT : formatNumber(series.last, 1)} sobre 100 en el último cierre, ${formatSigned(series.change)} puntos desde ${formatMonth(first)}`}
      >
        <ScoreGuides box={BOX} withLabels={false} />
        <path
          d={linePath(drawn)}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {end && <circle cx={end.x} cy={end.y} r={2.4} fill={color} />}
      </svg>
      <p className="text-xs text-muted">
        {formatNumber(series.weight)} de 100 puntos ·{' '}
        {series.change === null
          ? UNKNOWN_TEXT
          : `${formatSigned(series.change)} desde ${formatMonth(first)}`}
      </p>
    </figure>
  );
}

interface PillarSparklinesProps {
  series: readonly PulsePillarSeries[];
}

/**
 * Shows the four pillars as small multiples on a shared 0-100 scale.
 *
 * Reading them side by side answers which pillar moved the score: the same
 * fall of ten points is a different event in the pillar worth 36 points and in
 * the one worth 12.
 *
 * @param props - One series per pillar, heaviest first.
 * @returns The grid of small multiples, or an empty state.
 */
export function PillarSparklines({ series }: PillarSparklinesProps) {
  if (series.length === 0 || series[0].points.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sin meses observados: los pilares aparecerán con el primer cierre.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
      {series.map((pillar) => (
        <PillarSparkline key={pillar.key} series={pillar} />
      ))}
    </div>
  );
}
