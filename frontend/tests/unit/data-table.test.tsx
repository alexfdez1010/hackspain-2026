import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';

interface Row {
  id: string;
  name: string;
  score: number | null;
}

const ROWS: readonly Row[] = [
  { id: 'r1', name: 'Beta', score: 20 },
  { id: 'r2', name: 'Alfa', score: null },
  { id: 'r3', name: 'Gamma', score: 80 },
];

const COLUMNS: readonly DataTableColumn<Row>[] = [
  {
    id: 'name',
    header: 'Nombre',
    isRowHeader: true,
    sortBy: (row) => row.name,
    cell: (row) => row.name,
  },
  {
    id: 'score',
    header: 'Score',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.score,
    cell: (row) => (row.score === null ? 'sin datos' : String(row.score)),
  },
  { id: 'note', header: 'Nota', cell: () => 'fija' },
];

const order = (markup: string) =>
  ['Alfa', 'Beta', 'Gamma'].sort(
    (a, b) => markup.indexOf(a) - markup.indexOf(b),
  );

describe('DataTable', () => {
  it('opens in the default order and announces it in the header', () => {
    const markup = renderToStaticMarkup(
      <DataTable
        aria-label="Prueba"
        columns={COLUMNS}
        rows={ROWS}
        rowId={(row) => row.id}
        defaultSort={{ column: 'score', direction: 'descending' }}
      />,
    );
    expect(order(markup)).toEqual(['Gamma', 'Beta', 'Alfa']);
    expect(markup).toContain('aria-sort="descending"');
    expect(markup).toContain('aria-label="Prueba"');
    expect(markup).toContain('tabular-nums');
  });

  it('keeps the incoming order when no default sort is given', () => {
    const markup = renderToStaticMarkup(
      <DataTable
        aria-label="Prueba"
        columns={COLUMNS}
        rows={ROWS}
        rowId={(row) => row.id}
      />,
    );
    expect(order(markup)).toEqual(['Beta', 'Alfa', 'Gamma']);
  });

  it('only marks the sortable columns as sortable', () => {
    const markup = renderToStaticMarkup(
      <DataTable
        aria-label="Prueba"
        columns={COLUMNS}
        rows={ROWS}
        rowId={(row) => row.id}
      />,
    );
    expect(markup.match(/data-allows-sorting="true"/g)).toHaveLength(2);
    expect(markup).toContain('Nota');
  });
});
