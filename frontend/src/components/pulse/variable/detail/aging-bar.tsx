import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { formatEuro, formatNumber, formatPercent } from '@/lib/format';
import type { AgingBucket } from '@/lib/pulse/details/types';
import { agingBucketView } from '@/lib/pulse/details/bands';

interface AgingBarProps {
  /** The five buckets of the export, in their published order. */
  aging: readonly AgingBucket[];
}

/**
 * Draws the open receivables as one stacked bar, oldest debt on the right.
 *
 * The width of a segment is what it is worth, and the colour is how overdue
 * it is: the tail past ninety days is the critical band, so a portfolio that
 * is mostly old reads as red without any figure being hidden — the legend
 * repeats every amount, its share and the invoices behind it.
 *
 * @param props - The aging buckets.
 * @returns The bar and its legend, or a note when nothing is open.
 */
export function AgingBar({ aging }: AgingBarProps) {
  const total = aging.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  if (total <= 0) {
    return <DetailNote>Sin cartera abierta al cierre del mes.</DetailNote>;
  }

  return (
    <div className="flex flex-col gap-3">
      <span
        className="flex h-4 w-full overflow-hidden rounded-sm"
        role="img"
        aria-label={`Antigüedad de ${formatEuro(total)} abiertos: ${aging
          .map(
            (row) =>
              `${agingBucketView(row.bucket).label}, ${formatEuro(row.amount)}`,
          )
          .join('; ')}`}
      >
        {aging.map((row) => {
          const view = agingBucketView(row.bucket);
          const share = (row.amount ?? 0) / total;
          if (share <= 0) return null;
          return (
            <span
              key={row.bucket}
              style={{
                width: `${share * 100}%`,
                backgroundColor: view.color,
                opacity: view.opacity,
              }}
            />
          );
        })}
      </span>
      <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {aging.map((row) => {
          const view = agingBucketView(row.bucket);
          return (
            <li key={row.bucket} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="block size-2.5 rounded-[2px]"
                style={{ backgroundColor: view.color, opacity: view.opacity }}
              />
              <span>{view.label}</span>
              <span className="tabular-nums">
                {formatEuro(row.amount)} ·{' '}
                {formatPercent((row.amount ?? 0) / total)} ·{' '}
                {formatNumber(row.invoices)} fras.
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
