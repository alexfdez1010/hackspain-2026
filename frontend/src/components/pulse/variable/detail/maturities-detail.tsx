'use client';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import { formatEuro, formatMonth, formatNumber } from '@/lib/format';
import type {
  DebtProduct,
  DetailMonth,
  MaturitiesDetail as MaturitiesBlock,
} from '@/lib/pulse/details/types';
import { formatDay, lastDetailMonth } from '@/lib/pulse/details/view';

const PRODUCT_COLUMNS: readonly DataTableColumn<DebtProduct>[] = [
  {
    id: 'product',
    header: 'Producto',
    isRowHeader: true,
    sortBy: (row) => `${row.bank} ${row.label}`,
    cell: (row) => `${row.bank} · ${row.label}`,
  },
  {
    id: 'type',
    header: 'Tipo',
    sortBy: (row) => row.type,
    cell: (row) => row.type,
  },
  {
    id: 'outstanding',
    header: 'Pendiente',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.outstanding,
    cell: (row) => formatEuro(row.outstanding),
  },
  {
    id: 'next',
    header: 'Próximo pago',
    cellClassName: 'whitespace-nowrap',
    sortBy: (row) => row.nextPaymentDate,
    cell: (row) =>
      row.nextPaymentDate === null ? (
        <span className="text-muted">sin calendario</span>
      ) : (
        formatDay(row.nextPaymentDate)
      ),
  },
  {
    id: 'periods',
    header: 'Cuotas restantes',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.periodsLeft,
    cell: (row) => formatNumber(row.periodsLeft),
  },
];

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
    id: 'service3m',
    header: 'Servicio 3 m',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.values.service3m,
    cell: (row) => formatEuro(row.values.service3m),
  },
  {
    id: 'cashEnd',
    header: 'Caja al cierre',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.values.cashEnd,
    cell: (row) => formatEuro(row.values.cashEnd),
  },
  {
    id: 'ratio',
    header: 'Ratio',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.values.ratio,
    cell: (row) => formatNumber(row.values.ratio, 2),
  },
];

interface MaturitiesDetailProps {
  block: MaturitiesBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Lists the bank debt of the company and puts its service next to the cash.
 *
 * The ratio is two quarters of debt service over the cash of the close: above
 * one, the company cannot serve half a year of debt with what it has.
 *
 * @param props - The block and its reference month.
 * @returns The debt products and the month-by-month service.
 */
export function MaturitiesDetail({ block, month }: MaturitiesDetailProps) {
  const { products, months } = block;
  const last = lastDetailMonth(months);

  return (
    <div className="flex flex-col gap-5">
      {products.length === 0 ? (
        <DetailNote>Sin deuda bancaria registrada.</DetailNote>
      ) : (
        <DataTable
          aria-label="Productos de deuda y su saldo pendiente"
          columns={PRODUCT_COLUMNS}
          rows={products}
          rowId={(row) => row.productId}
          defaultSort={{ column: 'outstanding', direction: 'descending' }}
        />
      )}
      {months.length === 0 ? (
        <DetailNote>Sin servicio de deuda mensual registrado.</DetailNote>
      ) : (
        <DataTable
          aria-label="Servicio de deuda frente a la caja, mes a mes"
          columns={MONTH_COLUMNS}
          rows={months}
          rowId={(row) => row.month}
          defaultSort={{ column: 'month', direction: 'descending' }}
        />
      )}
      <DetailNote>
        {`En ${formatMonth(month)}, ${formatEuro(last?.values.service3m ?? null)} de servicio en 3 meses frente a ${formatEuro(last?.values.cashEnd ?? null)} de caja: ratio ${formatNumber(last?.values.ratio ?? null, 2)}, que es dos veces el servicio de 3 meses entre la caja.`}
      </DetailNote>
    </div>
  );
}
