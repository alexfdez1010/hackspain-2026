'use client';

import { useMemo } from 'react';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { ScoreBadge } from '@/components/ui/score-badge';
import { formatBand, formatHorizon } from '@/lib/pulse/format';
import type { PulseForecastRow } from '@/lib/pulse/history';
import { formatMonth, formatSigned } from '@/lib/format';

interface PulseForecastTableProps {
  /** Forecast horizons, nearest month first. */
  rows: readonly PulseForecastRow[];
  /** Month of the last close, named so the horizons can be anchored. */
  baseMonth: string;
}

/**
 * Builds the columns of the forecast table for one base month.
 *
 * @param baseMonth - Month of the last close, named in the change header.
 * @returns The column definitions.
 */
function buildColumns(
  baseMonth: string,
): readonly DataTableColumn<PulseForecastRow>[] {
  return [
    {
      id: 'month',
      header: 'Mes previsto',
      headerTip: 'Mes aún sin cerrar: el valor es una previsión.',
      isRowHeader: true,
      cellClassName: 'whitespace-nowrap',
      sortBy: (row) => row.targetMonth,
      cell: (row) => formatMonth(row.targetMonth),
    },
    {
      id: 'horizon',
      header: 'Horizonte',
      headerTip: 'Meses hacia delante desde el último cierre.',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.horizon,
      cell: (row) => formatHorizon(row.horizon),
    },
    {
      id: 'pulse',
      header: 'PULSE previsto',
      headerTip: 'Valor central de la previsión.',
      sortBy: (row) => row.pulsePred,
      cell: (row) => <ScoreBadge score={row.pulsePred} />,
    },
    {
      id: 'band',
      header: 'Banda p10-p90',
      headerTip:
        'Intervalo de la previsión: nueve de cada diez escenarios caen dentro.',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.pulseP10,
      cell: (row) => formatBand(row.pulseP10, row.pulseP90),
    },
    {
      id: 'change',
      header: `Δ vs ${formatMonth(baseMonth)}`,
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.change,
      cell: (row) => formatSigned(row.change),
    },
  ];
}

/**
 * Lists the six predicted months with their band and the move they imply,
 * sortable by any column.
 *
 * Nothing in these rows is a measurement: the month column says «previsto» on
 * every line, the band is printed next to the point prediction, and the change
 * is always taken against the last observed score, which the caption names.
 *
 * Each header carries its definition in its `title`, so «Horizonte» or «Banda
 * p10-p90» can be read without leaving the table for the method page.
 *
 * @param props - The forecast rows and the month they are predicted from.
 * @returns The forecast table, or an empty state.
 */
export function PulseForecastTable({
  rows,
  baseMonth,
}: PulseForecastTableProps) {
  const columns = useMemo(() => buildColumns(baseMonth), [baseMonth]);
  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-secondary">
        Sin previsión publicada: hacen falta más meses observados para
        estimarla.
      </p>
    );
  }
  return (
    <DataTable
      aria-label="PULSE previsto por horizonte"
      columns={columns}
      rows={rows}
      rowId={(row) => String(row.horizon)}
      defaultSort={{ column: 'horizon', direction: 'ascending' }}
    />
  );
}
