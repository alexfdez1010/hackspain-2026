'use client';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { counterpartyColumn } from '@/components/pulse/variable/detail/ranking-table';
import { ShareBar } from '@/components/pulse/variable/detail/share-bar';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { counterpartyName } from '@/lib/company/names';
import { formatEuro, formatPercent } from '@/lib/format';
import type {
  CustomerBilling,
  TopClientDetail as TopClientBlock,
} from '@/lib/pulse/details/types';
import { growthText } from '@/lib/pulse/details/view';

const CUSTOMER_COLUMNS: readonly DataTableColumn<CustomerBilling>[] = [
  counterpartyColumn<CustomerBilling>('Cliente', {
    suffix: (row) =>
      row.top ? <span className="text-xs text-muted">Principal</span> : null,
  }),
  {
    id: 'billed',
    header: 'Facturado 3 m',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.billed3m,
    cell: (row) => formatEuro(row.billed3m),
  },
  {
    id: 'billedPrev',
    header: '3 m anteriores',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.billedPrev3m,
    cell: (row) => formatEuro(row.billedPrev3m),
  },
  {
    id: 'growth',
    header: 'Crecimiento',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.growth,
    cell: (row) =>
      row.growth === null ? (
        <span className="text-muted">{growthText(null)}</span>
      ) : (
        growthText(row.growth)
      ),
  },
  {
    id: 'share',
    header: 'Peso 12 m',
    sortBy: (row) => row.share12m,
    cell: (row) => (
      <span className="flex items-center gap-2">
        <ShareBar
          value={row.share12m}
          label={`${formatPercent(row.share12m)} de la facturación de 12 meses`}
        />
        <span className="tabular-nums">{formatPercent(row.share12m)}</span>
      </span>
    ),
  },
];

interface TopClientDetailProps {
  block: TopClientBlock;
}

/**
 * Ranks the customers of the company by what they billed this quarter and by
 * how much of the year they represent.
 *
 * The variable reads one customer, the one marked «Principal»; the ranking
 * shows whether losing it would be a dent or the end of the revenue, which
 * is the question the concentration answers.
 *
 * @param props - The block.
 * @returns The customer ranking and the weight of the main customer.
 */
export function TopClientDetail({ block }: TopClientDetailProps) {
  const { customers } = block;
  if (customers.length === 0) {
    return <DetailNote>Sin clientes facturados en el último año.</DetailNote>;
  }
  const top = customers.find((row) => row.top) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Clientes por facturación del trimestre"
        columns={CUSTOMER_COLUMNS}
        rows={customers}
        rowId={(row) => row.counterpartyId}
        defaultSort={{ column: 'billed', direction: 'descending' }}
      />
      <DetailNote>
        {top === null
          ? 'Sin cliente principal en el mes de cierre.'
          : `El cliente principal, ${counterpartyName(top.counterpartyId)}, es el ${formatPercent(top.share12m)} de la facturación de 12 meses. El crecimiento se recorta a ±100 %.`}
      </DetailNote>
    </div>
  );
}
