import { Card, Chip } from '@heroui/react';

import { LabelledBlock } from '@/components/advisor/labelled-block';
import { LeverList } from '@/components/advisor/lever-list';
import { OfferFigures } from '@/components/advisor/offer-figures';
import { OfferPrice } from '@/components/advisor/offer-price';
import { OfferReasons } from '@/components/advisor/offer-reasons';
import { OfferSizing } from '@/components/advisor/offer-sizing';
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
 * One recommended product with everything needed to argue it: the figures of
 * the offer, the rules that made it fit, how the amount was computed, what the
 * price pays for and what would make it cheaper.
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
      <Card.Content className="flex flex-col gap-6">
        <OfferFigures offer={offer} referenceLabel={referenceLabel} />
        <LabelledBlock title="Por qué">
          <OfferReasons
            reasons={offer.reasons}
            variableLabels={variableLabels}
          />
        </LabelledBlock>
        <LabelledBlock title="Importe">
          <OfferSizing sizing={offer.sizing} />
        </LabelledBlock>
        <LabelledBlock title="Precio">
          <OfferPrice offer={offer} />
        </LabelledBlock>
        <LabelledBlock title="Palancas">
          <LeverList
            levers={offer.levers}
            story={offer.leverStory}
            emptyText="Ningún pilar por debajo de 60: el precio ya no tiene margen de mejora por riesgo."
          />
        </LabelledBlock>
      </Card.Content>
    </Card>
  );
}
