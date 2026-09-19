'use client';

import { AgingBar } from '@/components/pulse/variable/detail/aging-bar';
import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { counterpartyColumn } from '@/components/pulse/variable/detail/ranking-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { formatEuro, formatMonth, formatPercent } from '@/lib/format';
import type {
  Ar90Detail as Ar90Block,
  Debtor,
} from '@/lib/pulse/details/types';
import { lastDetailMonth } from '@/lib/pulse/details/view';

const DEBTOR_COLUMNS: readonly DataTableColumn<Debtor>[] = [
  counterpartyColumn<Debtor>('Cliente'),
  {
    id: 'open',
    header: 'Abierto',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.open,
    cell: (row) => formatEuro(row.open),
  },
  {
    id: 'over90',
    header: '+90 días',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.over90,
    cell: (row) =>
      row.over90 !== null && row.over90 > 0 ? (
        <span
          className="font-medium"
          style={{ color: 'var(--score-critical)' }}
        >
          {formatEuro(row.over90)}
        </span>
      ) : (
        formatEuro(row.over90)
      ),
  },
  {
    id: 'shareOver90',
    header: '% del abierto',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.shareOver90,
    cell: (row) => formatPercent(row.shareOver90),
  },
];

interface Ar90DetailProps {
  block: Ar90Block;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Ages the open receivables of the close and names who owes the oldest part.
 *
 * The bar answers how much of the portfolio is past due, the table answers
 * which customer it sits with: the variable only reads the first figure, but
 * the decision is taken on the second.
 *
 * @param props - The block and its reference month.
 * @returns The aging bar, the debtor ranking and the figures of the month.
 */
export function Ar90Detail({ block, month }: Ar90DetailProps) {
  const { aging, debtors, months } = block;
  const last = lastDetailMonth(months);

  return (
    <div className="flex flex-col gap-5">
      <AgingBar aging={aging} />
      {debtors.length === 0 ? (
        <DetailNote>Sin clientes con saldo abierto al cierre.</DetailNote>
      ) : (
        <DataTable
          aria-label="Clientes con cartera abierta y tramo de más de 90 días"
          columns={DEBTOR_COLUMNS}
          rows={debtors}
          rowId={(row) => row.counterpartyId}
          defaultSort={{ column: 'over90', direction: 'descending' }}
        />
      )}
      <DetailNote>
        {`Cartera abierta en ${formatMonth(month)}: ${formatEuro(last?.values.open ?? null)}, de los que ${formatEuro(last?.values.over90 ?? null)} llevan más de 90 días vencidos, el ${formatPercent(last?.values.share ?? null)}.`}
      </DetailNote>
    </div>
  );
}
