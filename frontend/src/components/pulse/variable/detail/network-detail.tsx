'use client';

import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { counterpartyColumn } from '@/components/pulse/variable/detail/ranking-table';
import { ShareBar } from '@/components/pulse/variable/detail/share-bar';
import type { DataTableColumn } from '@/components/ui/data-table';
import { DataTable } from '@/components/ui/data-table';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatPercent,
  formatSigned,
} from '@/lib/format';
import type {
  NetworkCustomer,
  NetworkDetail as NetworkBlock,
} from '@/lib/pulse/details/types';
import { lastDetailMonth } from '@/lib/pulse/details/view';
import { scoreBand, scoreColor } from '@/lib/score';

/**
 * Prints the payment health of a customer on the 0-100 scale of the score.
 *
 * @param health - Share of its invoices settled on time, 0-1.
 * @returns The figure in the colour of its band, with the band spelled out.
 */
function HealthCell({ health }: { health: number | null }) {
  if (health === null || !Number.isFinite(health)) {
    return <span className="text-muted">sin datos</span>;
  }
  const score = health * 100;
  const band = scoreBand(score);
  return (
    <span
      className="font-medium tabular-nums"
      style={{ color: scoreColor(score) }}
      title={band.label}
    >
      {formatNumber(score)}
      <span className="sr-only"> de 100 — {band.label}</span>
    </span>
  );
}

const CUSTOMER_COLUMNS: readonly DataTableColumn<NetworkCustomer>[] = [
  counterpartyColumn<NetworkCustomer>('Cliente'),
  {
    id: 'share',
    header: 'Peso en la facturación',
    sortBy: (row) => row.share,
    cell: (row) => (
      <span className="flex items-center gap-2">
        <ShareBar
          value={row.share}
          label={`${formatPercent(row.share)} de la facturación de 6 meses`}
        />
        <span className="tabular-nums">{formatPercent(row.share)}</span>
      </span>
    ),
  },
  {
    id: 'health',
    header: 'Salud de pago',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.health,
    cell: (row) => <HealthCell health={row.health} />,
  },
  {
    id: 'healthD3',
    header: 'Variación 3 m',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.healthD3,
    cell: (row) =>
      row.healthD3 === null ? (
        '—'
      ) : (
        <span
          className="font-medium"
          style={{
            color:
              row.healthD3 < 0 ? 'var(--score-critical)' : 'var(--score-solid)',
          }}
        >
          {formatSigned(row.healthD3 * 100)}
          <span className="sr-only"> puntos de salud</span>
        </span>
      ),
  },
  {
    id: 'billed',
    header: 'Facturado 6 m',
    cellClassName: 'tabular-nums whitespace-nowrap',
    sortBy: (row) => row.billed6m,
    cell: (row) => formatEuro(row.billed6m),
  },
  {
    id: 'companies',
    header: 'Empresas que le facturan',
    cellClassName: 'tabular-nums',
    sortBy: (row) => row.nCompanies,
    cell: (row) => formatNumber(row.nCompanies),
  },
];

interface NetworkDetailProps {
  block: NetworkBlock;
  /** Reference month of the export, as `YYYY-MM`. */
  month: string;
}

/**
 * Ranks the customers of the company by how healthily they pay, across the
 * whole network and not only against this company.
 *
 * The exposure of the month is the average of the three-month move of that
 * health weighted by what each customer bills, so the rows at the top of the
 * ranking are the ones that decide the variable: a big customer whose health
 * is falling moves the score, a tiny one does not.
 *
 * @param props - The block and its reference month.
 * @returns The customer ranking and the exposure of the month.
 */
export function NetworkDetail({ block, month }: NetworkDetailProps) {
  const { customers, months } = block;
  const last = lastDetailMonth(months);
  const exposure = last?.values.exposure ?? null;
  if (customers.length === 0) {
    return (
      <DetailNote>
        Sin clientes con salud de pago comparable este mes.
      </DetailNote>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        aria-label="Clientes por peso en la facturación y salud de pago"
        columns={CUSTOMER_COLUMNS}
        rows={customers}
        rowId={(row) => row.counterpartyId}
        defaultSort={{ column: 'share', direction: 'descending' }}
      />
      <DetailNote>
        {`Exposición de ${formatMonth(month)}: ${formatSigned(exposure === null ? null : exposure * 100)} puntos de salud sobre ${formatNumber(last?.values.customers ?? null)} clientes comparables. La salud es la parte de sus facturas pagadas a tiempo, en toda la red.`}
      </DetailNote>
    </div>
  );
}
