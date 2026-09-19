'use client';

import { useMemo } from 'react';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { ScoreBadge } from '@/components/ui/score-badge';
import { formatRawValue, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseVariablePoint } from '@/lib/pulse/variable-series';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';

interface PulseVariableMonthTableProps {
  /** One point per observed month, ascending. */
  points: readonly PulseVariablePoint[];
  /** Unit of the raw figure, as the export declares it. */
  unit: string;
}

/**
 * Builds the columns of the month table for one unit.
 *
 * @param unit - Unit of the raw figure.
 * @returns The column definitions.
 */
function buildColumns(
  unit: string,
): readonly DataTableColumn<PulseVariablePoint>[] {
  return [
    {
      id: 'month',
      header: 'Mes',
      isRowHeader: true,
      cellClassName: 'whitespace-nowrap',
      sortBy: (row) => row.month,
      cell: (row) => formatMonth(row.month),
    },
    {
      id: 'score',
      header: 'Score',
      sortBy: (row) => row.score,
      cell: (row) =>
        row.score === null ? (
          <span className="text-muted">{UNKNOWN_TEXT}</span>
        ) : (
          <ScoreBadge score={row.score} />
        ),
    },
    {
      id: 'change',
      header: 'Variación',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.change,
      cell: (row) => formatSigned(row.change),
    },
    {
      id: 'raw',
      header: 'Valor',
      cellClassName: 'tabular-nums whitespace-nowrap',
      sortBy: (row) => row.raw,
      cell: (row) => formatRawValue(row.raw, unit),
    },
    {
      id: 'contribution',
      header: 'Aporte',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.contribution,
      cell: (row) =>
        row.contribution === null
          ? '—'
          : `${formatNumber(row.contribution, 2)} pts`,
    },
    {
      id: 'pillar',
      header: 'Pilar',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.pillarScore,
      cell: (row) => formatNumber(row.pillarScore, 1),
    },
    {
      id: 'pulse',
      header: 'PULSE',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.pulse,
      cell: (row) => formatNumber(row.pulse, 1),
    },
  ];
}

/**
 * Lists every observed month of the variable: its score and move, the raw
 * figure in its own unit, the points it put into the PULSE of that month and
 * the pillar and the score those points landed in.
 *
 * The table opens on the last close, because the decision is taken there and
 * the older months are read as context. A month without evidence keeps
 * «sin datos» and sinks to the bottom whichever column is sorted.
 *
 * @param props - The observed points and the unit of the raw figure.
 * @returns The month-by-month table, or an empty state.
 */
export function PulseVariableMonthTable({
  points,
  unit,
}: PulseVariableMonthTableProps) {
  const columns = useMemo(() => buildColumns(unit), [unit]);
  if (points.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sin meses observados: la tabla se llena con el primer cierre exportado.
      </p>
    );
  }
  return (
    <DataTable
      aria-label="Historial mensual de la variable"
      columns={columns}
      rows={points}
      rowId={(row) => row.month}
      defaultSort={{ column: 'month', direction: 'descending' }}
    />
  );
}
