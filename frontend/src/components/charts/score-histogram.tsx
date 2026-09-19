import { formatNumber } from '@/lib/xray/format';
import type { HistogramBin } from '@/lib/xray/selectors';

const HEIGHT = 120;
const LABELS = [0, 25, 50, 75, 100];

interface ScoreHistogramProps {
  /** Ordered buckets covering the 0-100 range. */
  bins: readonly HistogramBin[];
}

/**
 * Draws the portfolio score distribution as vertical bars coloured by band, so
 * the share of the portfolio below 50 is visible at a glance.
 *
 * @param props - The buckets to draw.
 * @returns An inline SVG histogram, or an empty state when there is no data.
 */
export function ScoreHistogram({ bins }: ScoreHistogramProps) {
  const max = Math.max(...bins.map((bin) => bin.count), 1);
  if (bins.length === 0) {
    return <p className="text-sm text-muted">Sin empresas puntuadas.</p>;
  }
  const slot = 100 / bins.length;
  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 100 ${HEIGHT}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Distribución de scores de la cartera"
      >
        {bins.map((bin, index) => {
          const height = (bin.count / max) * (HEIGHT - 4);
          return (
            <rect
              key={bin.from}
              x={index * slot}
              width={slot - 0.6}
              y={HEIGHT - height}
              height={height}
              fill={bin.color}
              fillOpacity={0.85}
            >
              <title>{`${bin.from}-${bin.to}: ${formatNumber(bin.count)} empresas`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        {LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </figure>
  );
}
