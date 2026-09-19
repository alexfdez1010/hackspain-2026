'use client';

import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import type { AdvisorProduct } from '@/lib/advisor/types';
import { formatNumber, formatPercent } from '@/lib/format';

/** Spanish label of each product family of the catalogue. */
const FAMILY: Record<string, string> = {
  circulante: 'Circulante',
  cobros: 'Cobros',
  pagos: 'Pagos',
  plazo: 'Plazo',
  tesoreria: 'Tesorería',
};

/**
 * Names the family of a product in Spanish.
 *
 * @param family - Family key of the catalogue.
 * @returns The label, or the key when it is not a known family.
 */
function familyLabel(family: string): string {
  return FAMILY[family] ?? family;
}

const COLUMNS: readonly DataTableColumn<AdvisorProduct>[] = [
  {
    id: 'label',
    header: 'Producto',
    isRowHeader: true,
    sortBy: (row) => row.label,
    cell: (row) => row.label,
  },
  {
    id: 'family',
    header: 'Familia',
    cellClassName: 'text-muted',
    sortBy: (row) => familyLabel(row.family),
    cell: (row) => familyLabel(row.family),
  },
  {
    id: 'margin',
    header: 'Margen',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.baseSpreadBps,
    cell: (row) => `${formatNumber(row.baseSpreadBps)} pb`,
  },
  {
    id: 'lgd',
    header: 'LGD',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.lgd,
    cell: (row) => formatPercent(row.lgd, 0),
  },
  {
    id: 'band',
    header: 'Banda del diferencial',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.minSpreadBps,
    cell: (row) =>
      `${formatNumber(row.minSpreadBps)} a ${formatNumber(row.maxSpreadBps)} pb`,
  },
  {
    id: 'tenor',
    header: 'Plazo',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.tenorMonths,
    cell: (row) => `${formatNumber(row.tenorMonths)} meses`,
  },
];

interface MethodProductTableProps {
  products: readonly AdvisorProduct[];
  /** Rendered when the catalogue is empty. */
  emptyText: string;
}

/**
 * Publishes the catalogue with the three constants that price each product:
 * its margin, the loss given default of the risk premium and the band the
 * spread is clamped to. Every column sorts; the band sorts by its lower bound.
 *
 * @param props - The products and the empty text.
 * @returns The table of the catalogue.
 */
export function MethodProductTable({
  products,
  emptyText,
}: MethodProductTableProps) {
  if (products.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  return (
    <DataTable
      aria-label="Catálogo de productos y sus constantes de precio"
      columns={COLUMNS}
      rows={products}
      rowId={(row) => row.key}
    />
  );
}
