import type { PulseVariableRow } from '@/lib/pulse/company-view';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/format';
import { scoreColor } from '@/lib/score';

interface ContributionBarsProps {
  /** Variable rows of one month, already ordered by contribution. */
  rows: readonly PulseVariableRow[];
  /** Text shown when the month carries no contribution at all. */
  emptyText: string;
}

/**
 * Shows how many points of PULSE each variable carries in one month.
 *
 * The bars start at zero and are scaled against the largest contribution of
 * the month, so their length reads as points, not as a score: a variable with
 * a high score but a small weight stays a short bar. A variable with no
 * evidence has no bar and says «sin datos», because contributing nothing and
 * being unmeasured are different facts.
 *
 * @param props - The rows of the month and the empty-state text.
 * @returns A list of bars in points of the raw score.
 */
export function ContributionBars({ rows, emptyText }: ContributionBarsProps) {
  const known = rows.filter((row) => row.known && row.contribution !== null);
  if (known.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  const max = Math.max(...known.map((row) => row.contribution ?? 0), 1);

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const points = row.known ? (row.contribution ?? null) : null;
        return (
          <li
            key={row.key}
            className="grid grid-cols-[10rem_1fr_5rem] items-center gap-3 text-sm max-sm:grid-cols-[7.5rem_1fr_4.5rem]"
          >
            <span className="min-w-0">
              <span className="block truncate">{row.label}</span>
              <span className="block text-xs text-muted">
                {formatNumber(row.weight)} pts de peso
              </span>
            </span>
            <span className="relative block h-2 rounded-sm bg-surface-secondary">
              {points !== null && (
                <span
                  className="absolute inset-y-0 left-0 rounded-sm"
                  style={{
                    width: `${Math.min(Math.max(points / max, 0), 1) * 100}%`,
                    backgroundColor: scoreColor(row.score),
                  }}
                />
              )}
            </span>
            <span className="text-right tabular-nums">
              {points === null ? (
                <span className="text-muted">{UNKNOWN_TEXT}</span>
              ) : (
                `${formatNumber(points, 2)} pts`
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
