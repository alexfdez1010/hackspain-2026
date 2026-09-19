'use client';

import { Table } from '@heroui/react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { SortDescriptor } from 'react-aria-components';

import type { SortAccessors, SortValue } from '@/lib/table/sort';
import { sortRows } from '@/lib/table/sort';

/** One column of a {@link DataTable}. */
export interface DataTableColumn<Row extends object> {
  /** Stable id, also the column named by the sort descriptor. */
  id: string;
  /** Header content. */
  header: ReactNode;
  /** Renders the cell of one row. */
  cell: (row: Row) => ReactNode;
  /**
   * Value the column sorts by. A column without it cannot be sorted; a `null`
   * value always sinks to the bottom.
   */
  sortBy?: (row: Row) => SortValue;
  /** Marks the column that names the row for assistive technology. */
  isRowHeader?: boolean;
  /** Class applied to every cell of the column, e.g. `tabular-nums`. */
  cellClassName?: string;
}

interface DataTableProps<Row extends object> {
  /** Accessible name of the table. */
  'aria-label': string;
  columns: readonly DataTableColumn<Row>[];
  rows: readonly Row[];
  /** Stable id of one row. */
  rowId: (row: Row) => string;
  /**
   * Order the table opens with, shown in the header. Omit it to keep the rows
   * in the order they arrive until the reader picks a column.
   */
  defaultSort?: SortDescriptor;
}

/**
 * Collects the sort accessors of the sortable columns, keyed by column id.
 *
 * @param columns - Columns of the table.
 * @returns The accessors the sort helper needs.
 */
function collectAccessors<Row extends object>(
  columns: readonly DataTableColumn<Row>[],
): SortAccessors<Row> {
  const accessors: Record<string, (row: Row) => SortValue> = {};
  for (const column of columns) {
    if (column.sortBy) {
      accessors[column.id] = column.sortBy;
    }
  }
  return accessors;
}

/**
 * Renders a HeroUI table whose columns the reader can sort by clicking their
 * header, in either direction.
 *
 * Sorting happens in the client on rows the server already computed; the
 * component never touches the data source. Rows with no value for the chosen
 * column stay at the bottom in both directions, so «sin datos» is never
 * mistaken for the best or the worst figure.
 *
 * @param props - Accessible name, columns, rows, row id and opening order.
 * @returns The sortable table inside a scroll container.
 */
export function DataTable<Row extends object>({
  'aria-label': ariaLabel,
  columns,
  rows,
  rowId,
  defaultSort,
}: DataTableProps<Row>) {
  const [sort, setSort] = useState<SortDescriptor | undefined>(defaultSort);
  const accessors = useMemo(() => collectAccessors(columns), [columns]);
  const sorted = useMemo(
    () => sortRows(rows, accessors, sort),
    [rows, accessors, sort],
  );

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label={ariaLabel}
          sortDescriptor={sort}
          onSortChange={setSort}
        >
          <Table.Header columns={columns}>
            {(column) => (
              <Table.Column
                id={column.id}
                isRowHeader={column.isRowHeader}
                allowsSorting={column.sortBy !== undefined}
              >
                {({ sortDirection }) =>
                  column.sortBy ? (
                    <Table.SortableColumnHeader sortDirection={sortDirection}>
                      {column.header}
                    </Table.SortableColumnHeader>
                  ) : (
                    column.header
                  )
                }
              </Table.Column>
            )}
          </Table.Header>
          <Table.Body items={sorted}>
            {(row) => (
              <Table.Row id={rowId(row)} columns={columns}>
                {(column) => (
                  <Table.Cell className={column.cellClassName}>
                    {column.cell(row)}
                  </Table.Cell>
                )}
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
