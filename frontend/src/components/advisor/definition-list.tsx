import type { ReactNode } from 'react';

/** One term of a definition list, with an optional qualifier. */
export interface DefinitionItem {
  key: string;
  label: string;
  value: ReactNode;
  /** Second line: the base, the unit or the source of the figure. */
  hint?: string;
}

interface DefinitionListProps {
  items: readonly DefinitionItem[];
  /** Number of columns from `sm` upwards. */
  columns?: 1 | 2 | 3;
}

const COLUMN_CLASS: Record<number, string> = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
};

/**
 * Renders compact term-value pairs: the label first, the figure under it.
 *
 * @param props - The pairs and the wide-screen column count.
 * @returns A responsive definition list.
 */
export function DefinitionList({ items, columns = 3 }: DefinitionListProps) {
  return (
    <dl
      className={`grid grid-cols-1 gap-x-8 gap-y-3 ${COLUMN_CLASS[columns]}`.trim()}
    >
      {items.map((item) => (
        <div key={item.key} className="flex flex-col">
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="text-sm font-medium tabular-nums">{item.value}</dd>
          {item.hint && <p className="text-xs text-muted">{item.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
