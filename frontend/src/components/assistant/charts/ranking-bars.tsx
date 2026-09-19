import { BarRow } from '@/components/assistant/charts/bar-row';
import type { RankingRow } from '@/lib/assistant/charts/types';

/**
 * A ranking as horizontal bars on one shared track, largest first.
 *
 * The bar is a comparison aid: the figure is always printed beside it, and
 * the detail carries the reading that qualifies it, such as how late a
 * customer pays. A row without magnitude keeps its place with an empty track.
 *
 * @param props - The rows, already ordered.
 * @returns The bar list.
 */
export function RankingBars({ rows }: { rows: readonly RankingRow[] }) {
  const max = Math.max(...rows.map((row) => Math.abs(row.value ?? 0)), 0);
  return (
    <ol className="flex flex-col gap-2.5">
      {rows.map((row, index) => {
        const width =
          row.value === null || max <= 0
            ? 0
            : Math.min(Math.abs(row.value) / max, 1) * 100;
        return (
          <BarRow
            key={row.id}
            label={`${index + 1}. ${row.label}`}
            detail={row.detail || undefined}
            value={<span className="text-foreground">{row.valueText}</span>}
            ariaLabel={`${row.label}: ${row.valueText}${row.detail ? `, ${row.detail}` : ''}`}
          >
            <span className="relative block h-2 rounded-sm bg-surface-secondary">
              <span
                className="absolute inset-y-0 left-0 rounded-sm"
                style={{
                  width: `${width}%`,
                  backgroundColor: row.color ?? 'var(--foreground)',
                  opacity: row.color ? 1 : 0.55,
                }}
              />
            </span>
          </BarRow>
        );
      })}
    </ol>
  );
}
