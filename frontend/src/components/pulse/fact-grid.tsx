import type { ReactNode } from 'react';

/** One figure of a {@link FactGrid}. */
export interface PulseFact {
  key: string;
  value: ReactNode;
  /** What the figure measures, printed under it. */
  label: string;
}

interface FactGridProps {
  items: readonly PulseFact[];
  /**
   * `2` keeps two fixed columns; `auto` fits as many 150 px columns as the
   * container allows.
   */
  columns?: 2 | 'auto';
}

/** Grid template of each layout. */
const TEMPLATE: Record<string, string> = {
  2: 'repeat(2,minmax(0,1fr))',
  auto: 'repeat(auto-fit,minmax(150px,1fr))',
};

/**
 * A strip of figures separated by hairlines instead of by cards.
 *
 * The one-pixel gap over a hairline background draws the separators without
 * adding a border to every cell, so the strip reads as one object and the
 * figures stay aligned on a single baseline.
 *
 * @param props - The figures and the column layout.
 * @returns The strip of figures.
 */
export function FactGrid({ items, columns = 'auto' }: FactGridProps) {
  return (
    <div
      style={{
        background: 'var(--border-subtle, var(--separator))',
        gridTemplateColumns: TEMPLATE[columns],
      }}
      className="grid gap-px overflow-hidden rounded-lg border border-hairline"
    >
      {items.map((item) => (
        <span key={item.key} className="bg-deep px-4.5 py-4">
          <span className="block text-xl font-semibold leading-snug">
            {item.value}
          </span>
          <small className="mt-0.5 block text-[13px] text-ink-secondary">
            {item.label}
          </small>
        </span>
      ))}
    </div>
  );
}
