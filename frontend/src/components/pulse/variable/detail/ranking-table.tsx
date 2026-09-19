import type { ReactNode } from 'react';

import type { DataTableColumn } from '@/components/ui/data-table';
import { counterpartyName } from '@/lib/company/names';

/** Any ranked row of the drill-down: it names an anonymous counterparty. */
export interface CounterpartyRow {
  counterpartyId: string;
}

interface CounterpartyColumnOptions<Row extends CounterpartyRow> {
  /** Text appended after the name, such as the mark of the top customer. */
  suffix?: (row: Row) => ReactNode;
}

/**
 * Builds the first column of a counterparty ranking.
 *
 * The export only carries `COUNTERPARTY_xxxxx` identifiers, which say nothing
 * to a reader; the column resolves each one to its stable trade name and
 * sorts alphabetically on that name, never on the identifier.
 *
 * @param header - Header of the column, `Cliente` or `Proveedor`.
 * @param options - Optional trailing mark for a row.
 * @returns The column definition.
 */
export function counterpartyColumn<Row extends CounterpartyRow>(
  header: string,
  options: CounterpartyColumnOptions<Row> = {},
): DataTableColumn<Row> {
  const { suffix } = options;
  return {
    id: 'counterparty',
    header,
    isRowHeader: true,
    sortBy: (row) => counterpartyName(row.counterpartyId),
    cell: (row) => (
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span>{counterpartyName(row.counterpartyId)}</span>
        {suffix?.(row)}
      </span>
    ),
  };
}
