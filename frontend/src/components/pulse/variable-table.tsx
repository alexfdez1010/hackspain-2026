'use client';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { ScoreBadge } from '@/components/ui/score-badge';
import type { PulseVariableRow } from '@/lib/pulse/company-view';
import { formatRawValue, UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/format';

interface PulseVariableTableProps {
  /** Variable rows of the month, already ordered by weight. */
  rows: readonly PulseVariableRow[];
}

const UNKNOWN = <span className="text-muted">{UNKNOWN_TEXT}</span>;

const COLUMNS: readonly DataTableColumn<PulseVariableRow>[] = [
  {
    id: 'label',
    header: 'Variable',
    isRowHeader: true,
    sortBy: (row) => row.number,
    cell: (row) => (
      <>
        <span className="mr-1.5 text-xs tabular-nums text-muted">
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
    header: 'Score',
    sortBy: (row) => (row.known ? row.score : null),
    cell: (row) => (row.known ? <ScoreBadge score={row.score} /> : UNKNOWN),
  },
  {
    id: 'raw',
    header: 'Valor',
    cellClassName: 'tabular-nums',
    sortBy: (row) => (row.known ? row.rawValue : null),
    cell: (row) =>
      row.known ? formatRawValue(row.rawValue, row.unit) : UNKNOWN,
  },
  {
    id: 'contribution',
    header: 'Aporte',
    cellClassName: 'tabular-nums',
    sortBy: (row) => (row.known ? row.contribution : null),
    cell: (row) =>
      row.known && row.contribution !== null
        ? `${formatNumber(row.contribution, 2)} pts`
        : UNKNOWN,
  },
];

/**
 * Lists the eleven variables of the month with their weight, score, raw figure
 * and the points they add to the score, sortable by any column.
 *
 * A variable with no evidence reads «sin datos» in every column: it contributes
 * nothing, but it is not a zero, and telling both apart is what makes the
 * confidence figure meaningful. Such rows sink to the bottom whatever the sort.
 *
 * @param props - The variable rows of the month being viewed.
 * @returns The variable table.
 */
export function PulseVariableTable({ rows }: PulseVariableTableProps) {
  return (
    <DataTable
      aria-label="Variables del score"
      columns={COLUMNS}
      rows={rows}
      rowId={(row) => row.key}
      defaultSort={{ column: 'weight', direction: 'descending' }}
    />
  );
}
