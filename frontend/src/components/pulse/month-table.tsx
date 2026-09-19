'use client';

import { useMemo } from 'react';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { ScoreBadge } from '@/components/ui/score-badge';
import { formatConfidence, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseMonthRow } from '@/lib/pulse/history';
import type { PulsePillarMeta } from '@/lib/pulse/types';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatSigned,
} from '@/lib/format';

interface PulseMonthTableProps {
  /** Observed months, most recent first. */
  rows: readonly PulseMonthRow[];
  /** Pillar metadata; the column order follows the published weights. */
  pillars: readonly PulsePillarMeta[];
}

/**
 * Builds one column per pillar, heaviest first.
 *
 * @param pillars - Pillar metadata.
 * @returns The pillar columns.
 */
function pillarColumns(
  pillars: readonly PulsePillarMeta[],
): DataTableColumn<PulseMonthRow>[] {
  return [...pillars]
    .sort((a, b) => b.weight - a.weight)
    .map((pillar) => ({
      id: pillar.key,
      header: pillar.label,
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.pillars[pillar.key] ?? null,
      cell: (row) => {
        const value = row.pillars[pillar.key] ?? null;
        return value === null ? (
          <span className="text-muted">{UNKNOWN_TEXT}</span>
        ) : (
          formatNumber(value, 1)
        );
      },
    }));
}

/**
 * Builds the columns of the month table for the published pillars.
 *
 * @param pillars - Pillar metadata.
 * @returns The column definitions.
 */
function buildColumns(
  pillars: readonly PulsePillarMeta[],
): readonly DataTableColumn<PulseMonthRow>[] {
  return [
    {
      id: 'month',
      header: 'Mes observado',
      isRowHeader: true,
      cellClassName: 'whitespace-nowrap',
      sortBy: (row) => row.month,
      cell: (row) => formatMonth(row.month),
    },
    {
      id: 'pulse',
      header: 'PULSE',
      sortBy: (row) => row.pulse,
      cell: (row) => <ScoreBadge score={row.pulse} />,
    },
    {
      id: 'change',
      header: 'Δ mes',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.change,
      cell: (row) =>
        row.change === null ? (
          <span className="text-muted">primer mes</span>
        ) : (
          formatSigned(row.change)
        ),
    },
    {
      id: 'confidence',
      header: 'Confianza',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.confidence,
      cell: (row) => (
        <>
          {formatConfidence(row.confidence)}
          {row.unknownCount > 0 && (
            <span className="block text-xs text-muted">
              {formatNumber(row.unknownCount)} var. sin datos
            </span>
          )}
        </>
      ),
    },
    ...pillarColumns(pillars),
    {
      id: 'cash',
      header: 'Caja a fin de mes',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.cashEnd,
      cell: (row) => formatEuro(row.cashEnd),
    },
  ];
}

/**
 * Lists every observed month with the score, its move and the four pillars,
 * sortable by any column.
 *
 * Rows open from the last close backwards, because the decision is taken on
 * the newest month and the history is read as context. The change of each row
 * is still measured against the month before it in time, so a positive figure
 * always means the company improved that month.
 *
 * @param props - The month rows and the pillar metadata.
 * @returns The month-by-month table, or an empty state.
 */
export function PulseMonthTable({ rows, pillars }: PulseMonthTableProps) {
  const columns = useMemo(() => buildColumns(pillars), [pillars]);
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">
        Sin meses observados: la tabla se llena con el primer cierre exportado.
      </p>
    );
  }
  return (
    <DataTable
      aria-label="PULSE observado mes a mes"
      columns={columns}
      rows={rows}
      rowId={(row) => row.month}
      defaultSort={{ column: 'month', direction: 'descending' }}
    />
  );
}
