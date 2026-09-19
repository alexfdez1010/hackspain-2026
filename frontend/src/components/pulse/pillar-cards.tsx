import { PillarSpark } from '@/components/charts/pillar-spark';
import { Panel } from '@/components/ui/panel';
import { bandSurfaceStyle, NO_DATA_COLOR } from '@/lib/pulse/band';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { pillarOrderIndex } from '@/lib/pulse/mosaic';
import type { PulsePillarSeries } from '@/lib/pulse/pillar-series';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';
import { scoreBand } from '@/lib/score';

interface PillarCardProps {
  series: PulsePillarSeries;
}

/**
 * One pillar: where it stands today, how it got there and how much of the
 * score it can move. The card wears the wash of its band, so the four read as
 * a severity map before any figure is read.
 *
 * @param props - The observed history of one pillar.
 * @returns The pillar card.
 */
function PillarCard({ series }: PillarCardProps) {
  const band = scoreBand(series.last);
  const first = series.points[0]?.month ?? '';
  return (
    <Panel className="min-w-0" style={bandSurfaceStyle(series.last)}>
      <div className="flex items-baseline justify-between gap-3">
        <b className="min-w-0 text-[15px] font-semibold leading-snug">
          {series.label}
        </b>
        <b className="text-[32px] font-semibold leading-tight tabular-nums tracking-tight">
          {series.last === null ? UNKNOWN_TEXT : formatNumber(series.last, 1)}
        </b>
      </div>
      <span className="mb-4 mt-1.5 inline-flex items-center gap-2 text-[13px] text-ink-secondary">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{
            background: series.last === null ? NO_DATA_COLOR : band.color,
          }}
        />
        {series.last === null ? UNKNOWN_TEXT : band.name} ·{' '}
        {formatNumber(series.weight)} de 100 puntos
      </span>
      <PillarSpark
        points={series.points}
        label={`${series.label}: ${series.last === null ? UNKNOWN_TEXT : formatNumber(series.last, 0)} sobre 100 en el último cierre`}
      />
      <span className="mt-2.5 block text-[13px] text-ink-secondary">
        {series.change === null || !first
          ? UNKNOWN_TEXT
          : `${formatSigned(series.change)} desde ${formatMonth(first)}`}
      </span>
    </Panel>
  );
}

interface PulsePillarCardsProps {
  /** One series per pillar, in any order. */
  series: readonly PulsePillarSeries[];
}

/**
 * The four pillars side by side, each with its score, its band, its weight and
 * the shape of its months.
 *
 * Reading them together answers which pillar moved the score: the same fall of
 * ten points is a different event in the pillar worth 36 points and in the one
 * worth 12, and the sparklines show whether the fall is new or old.
 *
 * @param props - The pillar series.
 * @returns The grid of pillar cards, or an empty state.
 */
export function PulsePillarCards({ series }: PulsePillarCardsProps) {
  if (series.length === 0 || series[0].points.length === 0) {
    return (
      <p className="text-sm text-ink-secondary">
        Sin meses observados: los pilares aparecerán con el primer cierre.
      </p>
    );
  }
  const ordered = [...series].sort(
    (a, b) => pillarOrderIndex(a.key) - pillarOrderIndex(b.key),
  );
  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
      {ordered.map((pillar) => (
        <PillarCard key={pillar.key} series={pillar} />
      ))}
    </div>
  );
}
