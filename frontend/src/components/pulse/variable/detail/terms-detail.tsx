'use client';

import { useMemo } from 'react';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { counterpartyColumn } from '@/components/pulse/variable/detail/ranking-table';
import { ShareBar } from '@/components/pulse/variable/detail/share-bar';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatSigned,
} from '@/lib/format';
import type {
  SupplierTerms,
  TermsDetail as TermsBlock,
} from '@/lib/pulse/details/types';
import { lastDetailMonth } from '@/lib/pulse/details/view';

/**
 * Builds the columns of the terms ranking for one scale of days.
 *
 * @param maxDays - Longest term granted, which fills the bar track.
 * @returns The column definitions.
 */
function buildColumns(
  maxDays: number,
): readonly DataTableColumn<SupplierTerms>[] {
  return [
    counterpartyColumn<SupplierTerms>('Proveedor'),
    {
      id: 'billed',
      header: 'Facturado 6 m',
      cellClassName: 'tabular-nums whitespace-nowrap',
      sortBy: (row) => row.billed6m,
      cell: (row) => formatEuro(row.billed6m),
    },
    {
      id: 'invoices',
      header: 'Facturas',
      cellClassName: 'tabular-nums',
      sortBy: (row) => row.invoices,
      cell: (row) => formatNumber(row.invoices),
    },
    {
      id: 'terms',
      header: 'Plazo',
      sortBy: (row) => row.termsDays,
      cell: (row) => (
        <span className="flex items-center gap-2">
          <ShareBar
            value={row.termsDays}
            max={maxDays}
            label={`${formatNumber(row.termsDays, 1)} días sobre un máximo de ${formatNumber(maxDays, 1)}`}
          />
          <span className="whitespace-nowrap tabular-nums">
            {formatNumber(row.termsDays, 1)} días
          </span>
        </span>
      ),
    },
  ];
}

interface TermsDetailProps {
  block: TermsBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Ranks the suppliers by the term each one grants the company.
 *
 * The bar is scaled to the longest term of the ranking, so the reader sees
 * at a glance which suppliers finance the company and which are paid on
 * delivery; the amount billed says how much that term is worth.
 *
 * @param props - The block and its reference month.
 * @returns The terms ranking and the average term of the month.
 */
export function TermsDetail({ block, month }: TermsDetailProps) {
  const { suppliers, months } = block;
  const maxDays = useMemo(
    () =>
      Math.max(
        1,
        ...suppliers.map((row) => (row.termsDays === null ? 0 : row.termsDays)),
      ),
    [suppliers],
  );
  const columns = useMemo(() => buildColumns(maxDays), [maxDays]);
  const last = lastDetailMonth(months);
  if (suppliers.length === 0) {
    return (
      <DetailNote>Sin facturas de proveedor en los últimos 6 meses.</DetailNote>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Plazo concedido por cada proveedor"
        columns={columns}
        rows={suppliers}
        rowId={(row) => row.counterpartyId}
        defaultSort={{ column: 'billed', direction: 'descending' }}
      />
      <DetailNote>
        {`Plazo medio de ${formatMonth(month)}: ${formatNumber(last?.values.termsDays ?? null, 1)} días, ${formatSigned(last?.values.termsD6 ?? null)} en 6 meses.`}
      </DetailNote>
    </div>
  );
}
