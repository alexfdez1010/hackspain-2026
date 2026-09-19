import type { SortDescriptor } from 'react-aria-components';

/**
 * Value a column sorts by. `null` stands for «sin datos» and always sinks to
 * the bottom, whatever the direction, so a missing figure never reads as the
 * smallest or the largest one.
 */
export type SortValue = number | string | null;

/** Sort accessor of every sortable column, keyed by column id. */
export type SortAccessors<Row> = Readonly<
  Record<string, (row: Row) => SortValue>
>;

/** Spanish collation, so «Días de caja» sorts next to «Deuda». */
const COLLATOR = new Intl.Collator('es', {
  numeric: true,
  sensitivity: 'base',
});

/**
 * Compares two sort values in ascending order.
 *
 * Numbers compare numerically, strings with the Spanish collator and a `null`
 * (or `NaN`) is always greater than any value, so it goes last.
 *
 * @param a - Left value.
 * @param b - Right value.
 * @returns Negative when `a` goes first, positive when `b` does, zero on ties.
 */
export function compareSortValues(a: SortValue, b: SortValue): number {
  const left = normalise(a);
  const right = normalise(b);
  if (left === null) {
    return right === null ? 0 : 1;
  }
  if (right === null) {
    return -1;
  }
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  return COLLATOR.compare(String(left), String(right));
}

/**
 * Returns the rows in the order the descriptor asks for.
 *
 * The sort is stable, so rows that tie keep the order they came in, and rows
 * without a value for the column stay at the bottom in both directions. An
 * unknown column, or no descriptor, keeps the incoming order.
 *
 * @param rows - Rows in their original order.
 * @param accessors - Sort accessor of each sortable column.
 * @param descriptor - Column and direction chosen by the reader.
 * @returns A new array with the rows sorted.
 */
export function sortRows<Row>(
  rows: readonly Row[],
  accessors: SortAccessors<Row>,
  descriptor: SortDescriptor | undefined,
): Row[] {
  const accessor = descriptor
    ? accessors[String(descriptor.column)]
    : undefined;
  if (!accessor) {
    return [...rows];
  }
  const sign = descriptor?.direction === 'descending' ? -1 : 1;
  return rows
    .map((row) => ({ row, value: normalise(accessor(row)) }))
    .sort((a, b) => {
      if (a.value === null || b.value === null) {
        return compareSortValues(a.value, b.value);
      }
      return sign * compareSortValues(a.value, b.value);
    })
    .map((entry) => entry.row);
}

/**
 * Turns `NaN` into `null` so it sorts as a missing value.
 *
 * @param value - Raw sort value.
 * @returns The value, or `null` when it is not comparable.
 */
function normalise(value: SortValue): SortValue {
  return typeof value === 'number' && Number.isNaN(value) ? null : value;
}
