import type { ReactNode } from 'react';

/** One headline figure with the context needed to read it. */
export interface StatItem {
  key: string;
  label: string;
  value: ReactNode;
  /** Optional qualifier: a unit, a share or the comparison base. */
  hint?: string;
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
 * Renders the headline figures of a page as a plain grid.
 *
 * Figures carry no card outline: the grouping comes from spacing and from the
 * label sitting directly under its value.
 *
 * @param props - The figures and the wide-screen column count.
 * @returns A responsive grid of figures.
 */
export function StatGrid({ items, columns = 4 }: StatGridProps) {
  return (
    <dl className={`grid grid-cols-2 gap-x-6 gap-y-5 ${COLUMN_CLASS[columns]}`}>
      {items.map((item) => (
        <div key={item.key} className="flex flex-col gap-0.5">
          <dt className="order-2 text-sm text-muted">{item.label}</dt>
          <dd className="order-1 text-2xl font-semibold tabular-nums tracking-tight">
            {item.value}
          </dd>
          {item.hint && (
            <p className="order-3 text-xs text-muted">{item.hint}</p>
          )}
        </div>
      ))}
    </dl>
  );
}
