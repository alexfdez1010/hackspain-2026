'use client';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { ScoreBadge } from '@/components/ui/score-badge';
import type { MethodExampleRow } from '@/lib/method/example';
import { formatNumber } from '@/lib/format';

interface MethodExampleTableProps {
  /** Variables with evidence, largest contribution first. */
  rows: readonly MethodExampleRow[];
}

const COLUMNS: readonly DataTableColumn<MethodExampleRow>[] = [
  {
    id: 'label',
    header: 'Variable',
    isRowHeader: true,
    sortBy: (row) => row.number,
    cell: (row) => (
      <>
        <span className="mr-1.5 font-mono text-xs text-muted">
          {formatNumber(row.number)}
        </span>
        {row.label}
      </>
    ),
  },
  {
    id: 'pillar',
    header: 'Pilar',
    cellClassName: 'text-muted',
    sortBy: (row) => row.pillarLabel,
    cell: (row) => row.pillarLabel,
  },
  {
    id: 'weight',
    header: 'Peso',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.weight,
    cell: (row) => `${formatNumber(row.weight)} pts`,
  },
  {
    id: 'score',
    header: 'Score 0-100',
    sortBy: (row) => row.score,
    cell: (row) => <ScoreBadge score={row.score} />,
  },
  {
    id: 'contribution',
    header: 'Aporte a PULSE',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.contribution,
    cell: (row) => formatNumber(row.contribution, 2),
  },
];

/**
 * Lists the variables that built the score of one month, with the points each
 * one added, sortable by any column.
 *
 * @param props - The rows of the worked example.
 * @returns The table of contributions.
 */
export function MethodExampleTable({ rows }: MethodExampleTableProps) {
  return (
    <DataTable
      aria-label="Aporte de cada variable al score del mes"
      columns={COLUMNS}
      rows={rows}
      rowId={(row) => row.key}
      defaultSort={{ column: 'contribution', direction: 'descending' }}
    />
  );
}
