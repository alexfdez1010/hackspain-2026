import { formatEuro, formatMonth, formatMonthShort } from '@/lib/xray/format';
import type { OfferPoint, OfferStatus } from '@/lib/xray/offer';

const STATUS_COLOR: Record<OfferStatus, string> = {
  preaprobada: 'var(--score-solid)',
  'en vigilancia': 'var(--score-fragile)',
  cerrada: 'var(--score-critical)',
};

const HEIGHT = 56;

interface LimitTimelineProps {
  /** Limit recomputed month by month, ascending. */
  history: readonly OfferPoint[];
}

/**
 * Draws how the pre-approved limit would have moved over the last 12 months.
 *
 * Bar height is the limit and bar colour is the commercial state, so a line
 * that tightens before a deterioration is visible without reading numbers.
 *
 * @param props - The recomputed limit history.
 * @returns A compact bar chart with the first and last month labelled.
 */
export function LimitTimeline({ history }: LimitTimelineProps) {
  if (history.length === 0) {
    return <p className="text-sm text-muted">Sin historial suficiente.</p>;
  }
  const max = Math.max(...history.map((point) => point.limit), 1);
  const slot = 100 / history.length;
  return (
    <figure className="flex flex-col gap-1.5">
      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        className="h-14 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Límite mensual desde ${formatMonth(history[0].month)} hasta ${formatMonth(history[history.length - 1].month)}`}
      >
        {history.map((point, index) => {
          const height = Math.max((point.limit / max) * HEIGHT, 1);
          return (
            <rect
              key={point.month}
              x={index * slot}
              width={slot - 0.8}
              y={HEIGHT - height}
              height={height}
              fill={STATUS_COLOR[point.status]}
              fillOpacity={0.9}
            >
              <title>{`${formatMonth(point.month)}: ${formatEuro(point.limit)} · ${point.status}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        <span>{formatMonthShort(history[0].month)}</span>
        <span>{formatEuro(max)} máx.</span>
        <span>{formatMonthShort(history[history.length - 1].month)}</span>
      </div>
    </figure>
  );
}
