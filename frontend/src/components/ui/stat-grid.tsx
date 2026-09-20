import type { ReactNode } from 'react';

import { InfoTip } from '@/components/ui/info-tip';

/** One headline figure with the context needed to read it. */
export interface StatItem {
  key: string;
  label: string;
  value: ReactNode;
  /** Optional qualifier: a unit, a share or the comparison base. */
  hint?: string;
  /**
   * Optional plain-language definition of the figure, opened from a small
   * info button beside the label. It answers «what is this number» without
   * adding a third line of copy to a strip that must stay scannable.
   */
  tip?: string;
}

interface StatGridProps {
  items: readonly StatItem[];
  /** Number of columns on wide screens. */
  columns?: 3 | 4 | 5;
}

const COLUMN_CLASS: Record<number, string> = {
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-3 lg:grid-cols-5',
};

/**
 * Renders the headline figures of a page as the brand KPI strip: one bordered
 * panel whose cells are separated by hairlines, never by gaps.
 *
 * Every cell carries its own left and top hairline and the grid is pulled one
 * pixel up and left inside the panel, so the outer lines are clipped by the
 * rounded border and the count of columns can change with the viewport
 * without any cell needing to know where it sits.
 *
 * A figure with a `tip` gets an {@link InfoTip} beside its label: an icon
 * that opens the definition on hover and pins it on press, which reaches a
 * finger and a keyboard where a `title` attribute never would.
 *
 * @param props - The figures and the wide-screen column count.
 * @returns A bordered strip of figures.
 */
export function StatGrid({ items, columns = 4 }: StatGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-raised">
      <dl className={`-ml-px -mt-px grid grid-cols-2 ${COLUMN_CLASS[columns]}`}>
        {items.map((item) => (
          <div
            key={item.key}
            className="flex flex-col border-l border-t border-hairline px-6 py-5"
          >
            <dt className="order-2 mt-2 flex items-center gap-1.5 text-sm font-medium leading-[1.2]">
              {item.label}
              {item.tip && <InfoTip label={item.label}>{item.tip}</InfoTip>}
            </dt>
            <dd className="order-1 text-[32px] font-semibold leading-[1.1] tracking-[-0.01em] tabular-nums">
              {item.value}
            </dd>
            {item.hint && (
              <p className="order-3 text-[13px] leading-[1.45] text-ink-secondary">
                {item.hint}
              </p>
            )}
          </div>
        ))}
      </dl>
    </div>
  );
}
