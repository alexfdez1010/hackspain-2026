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
 * A strip of figures ruled by hairlines instead of boxed into cells.
 *
 * Only the two edges of the strip and the line between two figures are drawn,
 * and the first cell gives up its inset, so the strip sits on the text column
 * of the panel and reads as one object rather than as a row of cards.
 *
 * @param props - The figures and the column layout.
 * @returns The strip of figures.
 */
export function FactGrid({ items, columns = 'auto' }: FactGridProps) {
  return (
    <div
      style={{ gridTemplateColumns: TEMPLATE[columns] }}
      className="border-hairline grid border-t border-b"
    >
      {items.map((item) => (
        <span
          key={item.key}
          className="border-hairline border-l px-6 py-5 first:border-l-0 first:pl-0"
        >
          <b className="block text-2xl leading-[1.1] font-semibold tracking-[-0.01em] tabular-nums">
            {item.value}
          </b>
          <small className="text-ink-secondary mt-1.5 block text-[13px] leading-[1.45]">
            {item.label}
          </small>
        </span>
      ))}
    </div>
  );
}
