'use client';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { LateDaysCell } from '@/components/pulse/variable/detail/late-days';
import { counterpartyColumn } from '@/components/pulse/variable/detail/ranking-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { formatEuro, formatMonth, formatNumber } from '@/lib/format';
import type {
  CustomerCollection,
  DsoDetail as DsoBlock,
} from '@/lib/pulse/details/types';
import { lastDetailMonth } from '@/lib/pulse/details/view';

const CUSTOMER_COLUMNS: readonly DataTableColumn<CustomerCollection>[] = [
  counterpartyColumn<CustomerCollection>('Cliente'),
  {
    id: 'collected',
    header: 'Cobrado 3 m',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.collected3m,
    cell: (row) => formatEuro(row.collected3m),
  },
  {
    id: 'invoices',
    header: 'Facturas',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.invoices,
    cell: (row) => formatNumber(row.invoices),
  },
  {
    id: 'dso',
    header: 'DSO',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.dsoDays,
    cell: (row) => `${formatNumber(row.dsoDays, 1)} días`,
  },
  {
    id: 'terms',
    header: 'Plazo',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.termsDays,
    cell: (row) => `${formatNumber(row.termsDays, 1)} días`,
  },
  {
    id: 'late',
    header: 'Retraso',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.lateDays,
    cell: (row) => <LateDaysCell days={row.lateDays} subject="customer" />,
  },
];

interface DsoDetailProps {
  block: DsoBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Ranks the customers that paid the company in the last quarter, with the
 * days each one took and the days it was given.
 *
 * A positive delay here is money the company is lending its customers, so it
 * is read as the critical end of the column.
 *
 * @param props - The block and its reference month.
 * @returns The customer ranking and the DSO of the month.
 */
export function DsoDetail({ block, month }: DsoDetailProps) {
  const { customers, months } = block;
  const last = lastDetailMonth(months);
  if (customers.length === 0) {
    return (
      <DetailNote>Sin cobros de cliente en los últimos 3 meses.</DetailNote>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Clientes por importe cobrado en el trimestre"
        columns={CUSTOMER_COLUMNS}
        rows={customers}
        rowId={(row) => row.counterpartyId}
        defaultSort={{ column: 'collected', direction: 'descending' }}
      />
      <DetailNote>
        {`DSO ponderado de ${formatMonth(month)}: ${formatNumber(last?.values.dsoDays ?? null, 1)} días. Un retraso positivo es un cliente que paga después del vencimiento.`}
      </DetailNote>
    </div>
  );
}
