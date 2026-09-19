import { Accordion } from '@heroui/react';

import { LeverList } from '@/components/advisor/lever-list';
import { OfferPrice } from '@/components/advisor/offer-price';
import { OfferReasons } from '@/components/advisor/offer-reasons';
import { OfferSizing } from '@/components/advisor/offer-sizing';
import type { AdvisorOffer } from '@/lib/advisor/types';

interface OfferDetailsProps {
  offer: AdvisorOffer;
  /** Spanish label of every PULSE variable, keyed by variable. */
  variableLabels: Readonly<Record<string, string>>;
}

/**
 * The argument behind an offer, folded into four panels the reader opens on
 * demand: why it fits, how the amount was sized, what the price pays for and
 * which pillar would make it cheaper.
 *
 * Everything stays in the document, so search and assistive technology still
 * reach it; only the visual weight of the card drops.
 *
 * @param props - The offer and the variable labels.
 * @returns An accordion with the four panels, all collapsed.
 */
export function OfferDetails({ offer, variableLabels }: OfferDetailsProps) {
  const panels = [
    {
      id: 'reasons',
      title: 'Por qué encaja',
      body: (
        <OfferReasons reasons={offer.reasons} variableLabels={variableLabels} />
      ),
    },
    {
      id: 'sizing',
      title: 'Cómo se calcula el importe',
      body: <OfferSizing sizing={offer.sizing} />,
    },
    {
      id: 'price',
      title: 'De qué se compone el precio',
      body: <OfferPrice offer={offer} />,
    },
    {
      id: 'levers',
      title: 'Qué lo abarataría',
      body: (
        <LeverList
          levers={offer.levers}
          story={offer.leverStory}
          emptyText="Ningún pilar por debajo de 60: el precio ya no tiene margen de mejora por riesgo."
        />
      ),
    },
  ];
  return (
    <Accordion allowsMultipleExpanded variant="surface">
      {panels.map((panel) => (
        <Accordion.Item key={panel.id} id={`${offer.product}-${panel.id}`}>
          <Accordion.Heading>
            <Accordion.Trigger>
              {panel.title}
              <Accordion.Indicator />
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body className="pb-2">{panel.body}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
}
