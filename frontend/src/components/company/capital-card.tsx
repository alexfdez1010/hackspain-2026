import { Card, Chip, Link as HeroLink } from '@heroui/react';

import { LimitTimeline } from '@/components/charts/limit-timeline';
import { formatBps, formatEuro } from '@/lib/xray/format';
import type { Offer, OfferPoint, OfferStatus } from '@/lib/xray/offer';

const STATUS_COLOR: Record<OfferStatus, 'success' | 'warning' | 'danger'> = {
  preaprobada: 'success',
  'en vigilancia': 'warning',
  cerrada: 'danger',
};

const STATUS_HINT: Record<OfferStatus, string> = {
  preaprobada: 'Disponible para disponer desde la plataforma.',
  'en vigilancia': 'Disponible, con revisión mensual y sin ampliaciones.',
  cerrada: 'Sin límite disponible hasta que el score recupere 35 puntos.',
};

interface CapitalCardProps {
  offer: Offer;
  /** Limit recomputed month by month over the last year. */
  history: readonly OfferPoint[];
  /** Average monthly inflow used as the base of the limit. */
  avgMonthlyInflow: number;
}

/**
 * Shows the working-capital line this company would get today.
 *
 * @param props - The priced offer, its 12-month history and the inflow base.
 * @returns The Capital card of the company page.
 */
export function CapitalCard({
  offer,
  history,
  avgMonthlyInflow,
}: CapitalCardProps) {
  return (
    <Card variant="secondary">
      <Card.Header>
        <Card.Title>Embat Capital</Card.Title>
        <Card.Description>{STATUS_HINT[offer.status]}</Card.Description>
      </Card.Header>
      <Card.Content className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <p className="flex flex-col">
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {formatEuro(offer.limit)}
            </span>
            <span className="text-sm text-muted">Límite preaprobado</span>
          </p>
          <p className="flex flex-col">
            <span className="text-3xl font-semibold tabular-nums tracking-tight">
              {formatBps(offer.spread_bps)}
            </span>
            <span className="text-sm text-muted">Diferencial sobre índice</span>
          </p>
          <Chip color={STATUS_COLOR[offer.status]} variant="soft" size="sm">
            <Chip.Label>{offer.status}</Chip.Label>
          </Chip>
        </div>

        <p className="text-sm text-muted">
          {offer.multiplier.toLocaleString('es-ES', {
            maximumFractionDigits: 2,
          })}{' '}
          × {formatEuro(avgMonthlyInflow)} de cobros medios mensuales.
        </p>

        <LimitTimeline history={history} />
      </Card.Content>
      <Card.Footer>
        <HeroLink href="/capital">
          Ver cómo se construye la línea
          <HeroLink.Icon />
        </HeroLink>
      </Card.Footer>
    </Card>
  );
}
