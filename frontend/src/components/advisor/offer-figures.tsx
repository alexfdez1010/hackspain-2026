import {
  DefinitionList,
  type DefinitionItem,
} from '@/components/advisor/definition-list';
import { FitBar } from '@/components/advisor/fit-bar';
import {
  formatEuroExact,
  formatRate,
  formatSignedBps,
  formatTenor,
  RATE_KIND_LABELS,
} from '@/lib/advisor/format';
import type { AdvisorOffer } from '@/lib/advisor/types';

interface OfferFiguresProps {
  offer: AdvisorOffer;
  /** Name of the rate the spread is quoted over, such as `Euríbor 12 m`. */
  referenceLabel: string;
}

/**
 * States the four figures that decide an offer: how much, for how long, at
 * what rate and, for an amortising product, what it costs every month.
 *
 * @param props - The offer and the name of its reference rate.
 * @returns The headline figures of an offer next to its fit.
 */
export function OfferFigures({ offer, referenceLabel }: OfferFiguresProps) {
  const items: DefinitionItem[] = [
    {
      key: 'amount',
      label: offer.rateKind === 'yield' ? 'Excedente colocable' : 'Importe',
      value: formatEuroExact(offer.amount),
    },
    { key: 'tenor', label: 'Plazo', value: formatTenor(offer.tenorMonths) },
    {
      key: 'rate',
      label: RATE_KIND_LABELS[offer.rateKind],
      value: formatRate(offer.annualRate),
      hint: `${formatSignedBps(offer.spreadBps ?? 0)} sobre ${referenceLabel}`,
    },
  ];
  if (offer.monthlyInstalment !== null) {
    items.push({
      key: 'instalment',
      label: 'Cuota mensual',
      value: formatEuroExact(offer.monthlyInstalment),
      hint: 'Capital e intereses',
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-x-10 gap-y-5">
      <div className="min-w-0 flex-1">
        <DefinitionList items={items} columns={3} />
      </div>
      <FitBar fit={offer.fit} />
    </div>
  );
}
