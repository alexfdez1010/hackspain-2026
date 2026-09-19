import { formatNumber } from '@/lib/format';
import type { PulsePillarMeta, PulseVariableMeta } from '@/lib/pulse/types';

interface ScoreLegendProps {
  pillars: readonly PulsePillarMeta[];
  variables: readonly PulseVariableMeta[];
}

/**
 * Lists the four pillars and the eleven variables with the points each one
 * owns, grouped by pillar and ordered by weight.
 *
 * This is the transparency argument of PULSE: the weights are fixed, published
 * and add up to 100, so any score can be reconstructed by hand.
 *
 * @param props - Pillar and variable metadata from the export.
 * @returns A four-column legend, one column per pillar.
 */
export function ScoreLegend({ pillars, variables }: ScoreLegendProps) {
  const ordered = [...pillars].sort((a, b) => b.weight - a.weight);
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
      {ordered.map((pillar) => {
        const owned = variables
          .filter((variable) => variable.pillar === pillar.key)
          .sort((a, b) => b.weight - a.weight || a.number - b.number);
        return (
          <section key={pillar.key} className="flex flex-col gap-2">
            <h3 className="flex items-baseline justify-between gap-3 text-sm font-medium">
              <span>{pillar.label}</span>
              <span className="tabular-nums text-muted">
                {formatNumber(pillar.weight)} pts
              </span>
            </h3>
            <ul className="flex flex-col gap-1.5 text-sm">
              {owned.map((variable) => (
                <li
                  key={variable.key}
                  className="flex items-baseline justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="mr-1.5 text-xs tabular-nums text-muted">
                      {formatNumber(variable.number)}
                    </span>
                    {variable.label}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted">
                    {formatNumber(variable.weight)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
