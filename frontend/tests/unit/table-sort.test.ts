import { describe, expect, it } from 'vitest';

import { compareSortValues, sortRows } from '@/lib/table/sort';

interface Row {
  id: string;
  label: string;
  score: number | null;
}

const ROWS: readonly Row[] = [
  { id: 'a', label: 'Días de caja', score: 40 },
  { id: 'b', label: 'Deuda neta', score: null },
  { id: 'c', label: 'Ágil cobro', score: 70 },
  { id: 'd', label: 'Cobertura', score: 40 },
];

const ACCESSORS = {
  label: (row: Row) => row.label,
  score: (row: Row) => row.score,
};

const ids = (rows: readonly Row[]) => rows.map((row) => row.id);

describe('compareSortValues', () => {
  it('compares numbers numerically and strings with Spanish collation', () => {
    expect(compareSortValues(2, 10)).toBeLessThan(0);
    expect(compareSortValues('Ágil', 'Banda')).toBeLessThan(0);
    expect(compareSortValues('item 2', 'item 10')).toBeLessThan(0);
  });

  it('sends null and NaN after every value', () => {
    expect(compareSortValues(null, 5)).toBeGreaterThan(0);
    expect(compareSortValues(5, null)).toBeLessThan(0);
    expect(compareSortValues(Number.NaN, 5)).toBeGreaterThan(0);
    expect(compareSortValues(null, null)).toBe(0);
  });
});

describe('sortRows', () => {
  it('keeps the incoming order without a descriptor or with an unknown column', () => {
    expect(ids(sortRows(ROWS, ACCESSORS, undefined))).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(
      ids(
        sortRows(ROWS, ACCESSORS, { column: 'ghost', direction: 'ascending' }),
      ),
    ).toEqual(['a', 'b', 'c', 'd']);
  });

  it('sorts ascending with a stable tie-break and nulls last', () => {
    const sorted = sortRows(ROWS, ACCESSORS, {
      column: 'score',
      direction: 'ascending',
    });
    expect(ids(sorted)).toEqual(['a', 'd', 'c', 'b']);
  });

  it('sorts descending and still leaves nulls last', () => {
    const sorted = sortRows(ROWS, ACCESSORS, {
      column: 'score',
      direction: 'descending',
    });
    expect(ids(sorted)).toEqual(['c', 'a', 'd', 'b']);
  });

  it('sorts strings ignoring accents', () => {
    const sorted = sortRows(ROWS, ACCESSORS, {
      column: 'label',
      direction: 'ascending',
    });
    expect(ids(sorted)).toEqual(['c', 'd', 'b', 'a']);
  });

  it('does not mutate the input', () => {
    const copy = [...ROWS];
    sortRows(ROWS, ACCESSORS, { column: 'score', direction: 'descending' });
    expect(ROWS).toEqual(copy);
  });
});
