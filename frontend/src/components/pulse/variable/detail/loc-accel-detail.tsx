'use client';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { formatMonth, formatPercent, formatSigned } from '@/lib/format';
import type {
  DetailMonth,
  LocAccelDetail as LocAccelBlock,
} from '@/lib/pulse/details/types';
import { accelSentence, lastDetailMonth } from '@/lib/pulse/details/view';

/**
 * Renders a ratio move as points of utilisation.
 *
 * @param value - Move as a ratio of the limit; `null` when not comparable.
 * @returns The signed figure in points, or an em dash.
 */
function points(value: number | null): string {
  return value === null ? '—' : formatSigned(value * 100, 1);
}

const MONTH_COLUMNS: readonly DataTableColumn<DetailMonth>[] = [
  {
    id: 'month',
    header: 'Mes',
    isRowHeader: true,
    cellClassName: 'whitespace-nowrap',
    sortBy: (row) => row.month,
    cell: (row) => formatMonth(row.month),
  },
  {
    id: 'util',
    header: 'Utilización',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.values.util,
    cell: (row) => formatPercent(row.values.util),
  },
  {
    id: 'utilD3',
    header: 'Variación 3 m',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.values.utilD3,
    cell: (row) => points(row.values.utilD3),
  },
  {
    id: 'accel',
    header: 'Aceleración',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.values.accel,
    cell: (row) => points(row.values.accel),
  },
];

interface LocAccelDetailProps {
  block: LocAccelBlock;
}

/**
 * Reads the utilisation of the credit lines month by month: the level, how
 * much it moved in a quarter and whether that move is speeding up.
 *
 * Both moves are printed in points of the limit, never as percentages of a
 * percentage, which is the only way the two columns can be added up by eye.
 *
 * @param props - The block.
 * @returns The sentence of the last close and the month table.
 */
export function LocAccelDetail({ block }: LocAccelDetailProps) {
  const { months } = block;
  const last = lastDetailMonth(months);
  if (months.length === 0) {
    return <DetailNote>Sin utilización mensual registrada.</DetailNote>;
  }

  return (
    <div className="flex flex-col gap-4">
      <DetailNote>
        {accelSentence(last?.values.utilD3 ?? null, last?.values.accel ?? null)}
      </DetailNote>
      <DataTable
        aria-label="Utilización de líneas mes a mes"
        columns={MONTH_COLUMNS}
        rows={months}
        rowId={(row) => row.month}
        defaultSort={{ column: 'month', direction: 'descending' }}
      />
    </div>
  );
}
