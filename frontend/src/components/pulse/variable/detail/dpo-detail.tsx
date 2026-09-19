'use client';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { LateDaysCell } from '@/components/pulse/variable/detail/late-days';
import { counterpartyColumn } from '@/components/pulse/variable/detail/ranking-table';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatSigned,
} from '@/lib/format';
import type {
  DpoDetail as DpoBlock,
  SupplierPayment,
} from '@/lib/pulse/details/types';
import { lastDetailMonth } from '@/lib/pulse/details/view';

const SUPPLIER_COLUMNS: readonly DataTableColumn<SupplierPayment>[] = [
  counterpartyColumn<SupplierPayment>('Proveedor'),
  {
    id: 'paid',
    header: 'Pagado 3 m',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.paid3m,
    cell: (row) => formatEuro(row.paid3m),
  },
  {
    id: 'invoices',
    header: 'Facturas',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.invoices,
    cell: (row) => formatNumber(row.invoices),
  },
  {
    id: 'dpo',
    header: 'DPO',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.dpoDays,
    cell: (row) => `${formatNumber(row.dpoDays, 1)} días`,
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
    cell: (row) => <LateDaysCell days={row.lateDays} subject="supplier" />,
  },
];

interface DpoDetailProps {
  block: DpoBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Ranks the suppliers the company paid in the last quarter, with the days it
 * took and the days it was granted.
 *
 * The ranking opens by what was paid, because the weighted DPO of the month
 * is an average over those amounts: the supplier at the top is the one that
 * moves the variable.
 *
 * @param props - The block and its reference month.
 * @returns The supplier ranking and the DPO of the month.
 */
export function DpoDetail({ block, month }: DpoDetailProps) {
  const { suppliers, months } = block;
  const last = lastDetailMonth(months);
  if (suppliers.length === 0) {
    return (
      <DetailNote>Sin facturas de proveedor en los últimos 3 meses.</DetailNote>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Proveedores por importe pagado en el trimestre"
        columns={SUPPLIER_COLUMNS}
        rows={suppliers}
        rowId={(row) => row.counterpartyId}
        defaultSort={{ column: 'paid', direction: 'descending' }}
      />
      <DetailNote>
        {`DPO ponderado de ${formatMonth(month)}: ${formatNumber(last?.values.dpoDays ?? null, 1)} días, ${formatSigned(last?.values.dpoD3 ?? null)} en 3 meses. Un retraso negativo es un pago anticipado.`}
      </DetailNote>
    </div>
  );
}
