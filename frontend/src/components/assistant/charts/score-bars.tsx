import { BarRow } from '@/components/assistant/charts/bar-row';
import type { VariableBar } from '@/lib/assistant/charts/types';
import { formatNumber } from '@/lib/format';
import { SCORE_GUIDES, scoreBand } from '@/lib/score';

/**
 * The score of every variable of one month as a horizontal bar on the 0-100
 * scale, in the colour of its band, with the three band guides behind.
 *
 * A variable without evidence keeps its row and prints «sin datos» instead
 * of drawing a bar of zero it never scored.
 *
 * @param props - The rows, strongest first.
 * @returns The bar list.
 */
export function ScoreBars({ rows }: { rows: readonly VariableBar[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const band = scoreBand(row.score);
        return (
          <BarRow
            key={row.key}
            label={row.label}
            detail={row.known ? row.rawText : 'sin datos'}
            value={
              row.known ? (
                <span style={{ color: band.color }}>
                  {formatNumber(row.score, 0)}
                </span>
              ) : (
                <span className="text-muted">s/d</span>
              )
            }
            ariaLabel={
              row.known
                ? `${row.label}: ${formatNumber(row.score, 1)} sobre 100, ${band.name}`
                : `${row.label}: sin datos`
            }
          >
            <span className="relative block h-2.5 rounded-sm bg-surface-secondary">
              {SCORE_GUIDES.map((guide) => (
                <span
                  key={guide}
                  aria-hidden="true"
                  className="absolute inset-y-0 w-px bg-separator"
                  style={{ left: `${guide}%` }}
                />
              ))}
              {row.known && row.score !== null ? (
                <span
                  className="absolute inset-y-0 left-0 rounded-sm"
                  style={{
                    width: `${Math.min(Math.max(row.score, 0), 100)}%`,
                    backgroundColor: band.color,
                  }}
                />
              ) : null}
            </span>
          </BarRow>
        );
      })}
    </ul>
  );
}
