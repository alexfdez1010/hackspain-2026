'use client';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { formatHorizon } from '@/lib/pulse/format';
import type { PulseForecastHorizonEvaluation } from '@/lib/pulse/types';
import { formatNumber, formatPercent } from '@/lib/format';

type Row = PulseForecastHorizonEvaluation;

/**
 * Builds a numeric column whose cell is a formatted figure.
 *
 * @param id - Column id.
 * @param header - Header text.
 * @param value - Reads the figure of a row.
 * @param format - Formats the figure for the cell.
 * @param cellClassName - Cell classes on top of `tabular-nums`.
 * @returns The column definition.
 */
function numeric(
  id: string,
  header: string,
  value: (row: Row) => number | null,
  format: (value: number | null) => string,
  cellClassName = '',
): DataTableColumn<Row> {
  return {
    id,
    header,
    cellClassName: `tabular-nums ${cellClassName}`.trim(),
    sortBy: value,
    cell: (row) => format(value(row)),
  };
}

const COLUMNS: readonly DataTableColumn<Row>[] = [
  {
    id: 'horizon',
    header: 'Horizonte',
    isRowHeader: true,
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.horizon,
    cell: (row) => formatHorizon(row.horizon),
  },
  numeric(
    'persist',
    'MAE persistencia',
    (r) => r.maePersist,
    (v) => formatNumber(v, 2),
    'text-muted',
  ),
  numeric(
    'reversion',
    'MAE reversión',
    (r) => r.maeReversion,
    (v) => formatNumber(v, 2),
    'text-muted',
  ),
  numeric(
    'ml',
    'MAE modelo',
    (r) => r.maeMl,
    (v) => formatNumber(v, 2),
    'font-medium',
  ),
  numeric(
    'gain',
    'Ganancia',
    (r) => r.gainVsPersistPct,
    (v) => `${formatNumber(v, 1)} %`,
  ),
  numeric(
    'direction',
    'Dirección',
    (r) => r.directionAccuracyBigMoves,
    (v) => formatPercent(v, 0),
  ),
  numeric(
    'declines',
    'Caídas vistas',
    (r) => r.recallDeclines,
    (v) => formatPercent(v, 0),
  ),
  numeric(
    'improvements',
    'Mejoras vistas',
    (r) => r.recallImprovements,
    (v) => formatPercent(v, 0),
  ),
  numeric(
    'coverage',
    'Cobertura p10-p90',
    (r) => r.bandCoverage,
    (v) => formatPercent(v, 0),
  ),
];

interface MethodForecastTableProps {
  /** One row per horizon, ascending. */
  horizons: readonly Row[];
  /** Rendered when the export carries no forecast evaluation. */
  emptyText: string;
}

/**
 * Publishes the out-of-fold accuracy of the forecast at every horizon, next to
 * the two baselines it has to beat, sortable by any column.
 *
 * Persistence («el score se queda donde está») is the honest reference: a model
 * that does not beat it adds nothing.
 *
 * @param props - The evaluated horizons and the empty text.
 * @returns The table of metrics.
 */
export function MethodForecastTable({
  horizons,
  emptyText,
}: MethodForecastTableProps) {
  if (horizons.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  return (
    <DataTable
      aria-label="Precisión de la previsión por horizonte"
      columns={COLUMNS}
      rows={horizons}
      rowId={(row) => String(row.horizon)}
      defaultSort={{ column: 'horizon', direction: 'ascending' }}
    />
  );
}
