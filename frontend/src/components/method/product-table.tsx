'use client';

import { Table } from '@heroui/react';

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

interface MethodProductTableProps {
  products: readonly AdvisorProduct[];
  /** Rendered when the catalogue is empty. */
  emptyText: string;
}

/**
 * Publishes the catalogue with the three constants that price each product:
 * its margin, the loss given default of the risk premium and the band the
 * spread is clamped to.
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
  const rows = products.map((product) => ({ ...product, id: product.key }));
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="Catálogo de productos y sus constantes de precio">
          <Table.Header>
            <Table.Column id="label" isRowHeader>
              Producto
            </Table.Column>
            <Table.Column id="family">Familia</Table.Column>
            <Table.Column id="margin">Margen</Table.Column>
            <Table.Column id="lgd">LGD</Table.Column>
            <Table.Column id="band">Banda del diferencial</Table.Column>
            <Table.Column id="tenor">Plazo</Table.Column>
          </Table.Header>
          <Table.Body items={rows}>
            {(row) => (
              <Table.Row id={row.id}>
                <Table.Cell>{row.label}</Table.Cell>
                <Table.Cell className="text-muted">
                  {FAMILY[row.family] ?? row.family}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatNumber(row.baseSpreadBps)} pb
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatPercent(row.lgd, 0)}
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatNumber(row.minSpreadBps)} a{' '}
                  {formatNumber(row.maxSpreadBps)} pb
                </Table.Cell>
                <Table.Cell className="tabular-nums">
                  {formatNumber(row.tenorMonths)} meses
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
