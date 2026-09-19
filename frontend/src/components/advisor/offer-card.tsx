import { Card, Chip } from '@heroui/react';

import { OfferDetails } from '@/components/advisor/offer-details';
import { OfferFigures } from '@/components/advisor/offer-figures';
import { FAMILY_LABELS } from '@/lib/advisor/format';
import type { AdvisorOffer } from '@/lib/advisor/types';
import { formatNumber } from '@/lib/format';

interface OfferCardProps {
  offer: AdvisorOffer;
  /** Name of the rate every spread is quoted over. */
  referenceLabel: string;
  /** Spanish label of every PULSE variable, keyed by variable. */
  variableLabels: Readonly<Record<string, string>>;
}

/**
 * One recommended product: the figures of the offer at a glance and, folded
 * under them, the rules that made it fit, how the amount was computed, what
 * the price pays for and what would make it cheaper.
 *
 * @param props - The offer, the reference rate name and the variable labels.
 * @returns The card of one offer.
 */
export function OfferCard({
  offer,
  referenceLabel,
  variableLabels,
}: OfferCardProps) {
  return (
    <Card variant="secondary">
      <Card.Header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs text-muted tabular-nums">
            Recomendación {formatNumber(offer.rank)}
          </span>
          <Card.Title className="text-lg font-semibold tracking-tight">
            {offer.label}
          </Card.Title>
          <Chip size="sm" variant="soft">
            <Chip.Label>
              {FAMILY_LABELS[offer.family] ?? offer.family}
            </Chip.Label>
          </Chip>
        </div>
        <Card.Description className="max-w-3xl text-sm">
          {offer.headline}
        </Card.Description>
        <p className="max-w-3xl text-xs text-muted">{offer.what}</p>
      </Card.Header>
      <Card.Content className="flex flex-col gap-5">
        <OfferFigures offer={offer} referenceLabel={referenceLabel} />
        <OfferDetails offer={offer} variableLabels={variableLabels} />
      </Card.Content>
    </Card>
  );
}
