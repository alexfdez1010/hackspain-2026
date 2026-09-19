import type { PulseVariableRow } from '@/lib/pulse/company-view';
import { formatNumber } from '@/lib/format';
import { scoreColor } from '@/lib/score';

interface MonthContributionsProps {
  /** Variable rows of the month, largest contributor first. */
  rows: readonly PulseVariableRow[];
}

/**
 * How many points of PULSE each variable put into the month.
 *
 * The bars are proportional to the largest contribution, not to the score, so
 * the row that moved the month is the longest one; a variable with no evidence
 * keeps a name and says «sin datos» instead of drawing a zero-length bar that
 * would read as a bad result.
 *
 * @param props - The variable rows of the month.
 * @returns One row per variable, with its bar, its points and its weight.
 */
export function MonthContributions({ rows }: MonthContributionsProps) {
  const max = Math.max(...rows.map((row) => row.contribution ?? 0), 0.01);
  return (
    <ul>
      {rows.map((row) => (
        <li
          key={row.key}
          className="grid grid-cols-[minmax(0,1fr)_76px_76px] items-center gap-4 border-b border-hairline py-2.5 last:border-b-0"
        >
          <span className="min-w-0">
            <b
              className={`block text-sm font-medium leading-snug ${row.known ? 'text-ink' : 'text-ink-secondary'}`}
            >
              {row.label}
            </b>
            <span className="mt-2 block h-1.5 rounded bg-surface-secondary">
              {row.contribution !== null && (
                <span
                  className="block h-full rounded"
                  style={{
                    width: `${(row.contribution / max) * 100}%`,
                    background: scoreColor(row.score),
                  }}
                />
              )}
            </span>
          </span>
          <b
            className={`text-right text-[15px] font-medium tabular-nums ${row.known ? 'text-ink' : 'text-ink-secondary'}`}
          >
            {row.contribution === null
              ? 'sin datos'
              : formatNumber(row.contribution, 2)}
          </b>
          <span className="whitespace-nowrap text-right text-[13px] text-ink-secondary">
            {formatNumber(row.weight)} pts
          </span>
        </li>
      ))}
    </ul>
  );
}
