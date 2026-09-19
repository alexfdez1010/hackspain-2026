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
  /**
   * Alignment of the header and the cells. Columns of figures default to
   * `end`, which is how a numeric column is recognised: their cells carry
   * `tabular-nums`.
   */
  align?: 'start' | 'end';
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

/* Slot classes. Nothing here may repeat a property: HeroUI concatenates the
   strings without merging them, so two padding utilities would both survive. */
const HEADER_BASE =
  'whitespace-nowrap border-b border-hairline bg-transparent pt-0 pb-2.5 pl-5 first:pl-0 text-sm font-medium leading-[1.2] text-ink-secondary after:hidden';

const CELL_BASE =
  'border-b-0 bg-transparent py-3 pl-5 first:pl-0 align-top text-[15px] leading-[1.55]';

const START_CLASS = 'pr-4 text-left';

const END_CLASS = 'pr-0 text-right';

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
 * Resolves the alignment of one column: explicit first, otherwise `end` when
 * the column renders figures.
 *
 * @param column - The column being rendered.
 * @returns `true` when header and cells are right aligned.
 */
function isEndAligned<Row extends object>(
  column: DataTableColumn<Row>,
): boolean {
  if (column.align) return column.align === 'end';
  return column.cellClassName?.includes('tabular-nums') ?? false;
}

/**
 * Renders a HeroUI table whose columns the reader can sort by clicking their
 * header, in either direction.
 *
 * The table follows the brand rules: headers in 14/500 secondary ink over a
 * hairline, rows separated by hairlines with none under the last one, the
 * hovered row tinted `brand-subtle`, figures right aligned, and a horizontal
 * scroller so a wide table never widens the page.
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
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content
          aria-label={ariaLabel}
          sortDescriptor={sort}
          onSortChange={setSort}
          className="w-full border-collapse"
        >
          <Table.Header columns={columns}>
            {(column) => (
              <Table.Column
                id={column.id}
                isRowHeader={column.isRowHeader}
                allowsSorting={column.sortBy !== undefined}
                className={`${HEADER_BASE} ${isEndAligned(column) ? END_CLASS : START_CLASS}`}
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
              <Table.Row
                id={rowId(row)}
                columns={columns}
                className="border-b border-hairline last:border-b-0 hover:bg-brand-subtle"
              >
                {(column) => (
                  <Table.Cell
                    className={`${CELL_BASE} ${isEndAligned(column) ? END_CLASS : START_CLASS} ${column.cellClassName ?? ''}`}
                  >
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
