import { PillarSpark } from '@/components/charts/pillar-spark';
import { formatNumber, formatSigned } from '@/lib/format';
import type { PulsePillarSeries } from '@/lib/pulse/pillar-series';
import { scoreBand } from '@/lib/score';

/**
 * Four small multiples, one per pillar, on one shared vertical scale.
 *
 * Each cell names the pillar, prints the last score in the colour of its
 * band and the change since the first observed month, and draws the months
 * with the same sparkline the diagnosis page uses.
 *
 * @param props - The pillar series, heaviest first.
 * @returns The grid of sparklines.
 */
export function PillarGrid({
  pillars,
}: {
  pillars: readonly PulsePillarSeries[];
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
      {pillars.map((pillar) => {
        const band = scoreBand(pillar.last);
        return (
          <li key={pillar.key} className="flex min-w-0 flex-col gap-1">
            <span className="text-xs leading-tight font-medium text-foreground">
              {pillar.label}
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className="text-lg leading-none font-semibold tabular-nums"
                style={{ color: band.color }}
              >
                {formatNumber(pillar.last, 1)}
              </span>
              <span className="text-[11px] text-muted tabular-nums">
                {formatSigned(pillar.change, 1)} · {pillar.weight} pt
              </span>
              <span className="sr-only">{band.name}</span>
            </div>
            <PillarSpark
              points={pillar.points}
              label={`${pillar.label}: de ${formatNumber(pillar.points.find((p) => p.value !== null)?.value ?? null, 1)} a ${formatNumber(pillar.last, 1)}`}
            />
          </li>
        );
      })}
    </ul>
  );
}
