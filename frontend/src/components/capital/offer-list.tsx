import { Chip } from '@heroui/react';
import Link from 'next/link';

import { LimitTimeline } from '@/components/charts/limit-timeline';
import { ScoreBadge } from '@/components/xray/score-badge';
import { RegimeTag } from '@/components/xray/tags';
import { formatBps, formatEuro, formatPercent } from '@/lib/xray/format';
import type { OfferStatus } from '@/lib/xray/offer';
import type { OfferDetail } from '@/lib/xray/source/types';

const STATUS_COLOR: Record<OfferStatus, 'success' | 'warning' | 'danger'> = {
  preaprobada: 'success',
  'en vigilancia': 'warning',
  cerrada: 'danger',
};

interface OfferListProps {
  /** Priced lines with their 12-month limit history. */
  offers: readonly OfferDetail[];
}

/**
 * Renders the Capital marketplace: one block per company with the limit, the
 * price, the commercial state and how the limit moved over the last year.
 *
 * @param props - The priced lines to display.
 * @returns The marketplace list, or an empty state.
 */
export function OfferList({ offers }: OfferListProps) {
  if (offers.length === 0) {
    return (
      <p className="text-sm text-muted">
        Ninguna empresa en este estado con los datos actuales.
      </p>
    );
  }
  return (
    <ul className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
      {offers.map((row) => (
        <li key={row.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link
              href={`/empresa/${row.id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {row.id}
            </Link>
            <ScoreBadge score={row.score} />
            <Chip
              color={STATUS_COLOR[row.offer.status]}
              variant="soft"
              size="sm"
            >
              <Chip.Label>{row.offer.status}</Chip.Label>
            </Chip>
            <RegimeTag regime={row.regime} />
          </div>

          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex flex-col">
              <dt className="order-2 text-muted">Límite</dt>
              <dd className="order-1 text-lg font-semibold tabular-nums">
                {formatEuro(row.offer.limit)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="order-2 text-muted">Diferencial</dt>
              <dd className="order-1 text-lg font-semibold tabular-nums">
                {formatBps(row.offer.spread_bps)}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="order-2 text-muted">Prob. estrés</dt>
              <dd className="order-1 text-lg font-semibold tabular-nums">
                {formatPercent(row.pStress, 1)}
              </dd>
            </div>
          </dl>

          <LimitTimeline history={row.history} />
        </li>
      ))}
    </ul>
  );
}
