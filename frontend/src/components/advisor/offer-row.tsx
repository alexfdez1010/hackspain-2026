import { Disclosure } from '@heroui/react';

import { OfferDetails } from '@/components/advisor/offer-details';
import {
  FAMILY_LABELS,
  formatEuroExact,
  formatRate,
  formatSignedBps,
  formatTenor,
} from '@/lib/advisor/format';
import type { AdvisorOffer } from '@/lib/advisor/types';
import { formatNumber } from '@/lib/format';

interface OfferFigureProps {
  value: string;
  hint: string;
  /** `true` for the price, the only figure of the row that carries colour. */
  accent?: boolean;
}

/**
 * A figure of the row with the line that qualifies it.
 *
 * @param props - The figure, its qualifier and whether it is the price.
 * @returns The stacked pair.
 */
function OfferFigure({ value, hint, accent = false }: OfferFigureProps) {
  return (
    <span>
      <b
        className={`block text-[20px] leading-[1.35] font-semibold tabular-nums ${accent ? 'text-link-accent' : ''}`.trim()}
      >
        {value}
      </b>
      <small className="text-ink-secondary mt-0.5 block text-[13px] leading-[1.45]">
        {hint}
      </small>
    </span>
  );
}

/**
 * Says how long the money is for and, when the product amortises, what it
 * costs every month: the two figures that qualify the amount.
 *
 * @param offer - The offer being shown.
 * @returns The line under the amount.
 */
function tenorHint(offer: AdvisorOffer): string {
  const tenor = `a ${formatTenor(offer.tenorMonths)}`;
  if (offer.monthlyInstalment === null) return tenor;
  return `${tenor} · ${formatEuroExact(offer.monthlyInstalment)}/mes`;
}

interface OfferRowProps {
  offer: AdvisorOffer;
  /** Name of the rate every spread is quoted over. */
  referenceLabel: string;
  /** Spanish label of every PULSE variable, keyed by variable. */
  variableLabels: Readonly<Record<string, string>>;
}

/**
 * One approved product as a single line of the panel: what it is, how much
 * and for how long, at what price, and how well it fits. The argument behind
 * it — why it fits, how the amount was sized, what the price pays for and
 * what would make it cheaper — folds away under «Ver detalle», so nothing is
 * lost and nothing competes with the decision.
 *
 * @param props - The offer, the reference rate name and the variable labels.
 * @returns The row of one offer.
 */
export function OfferRow({
  offer,
  referenceLabel,
  variableLabels,
}: OfferRowProps) {
  return (
    <div className="border-hairline border-t py-5">
      <div className="grid items-center gap-x-6 gap-y-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <b className="text-[20px] leading-[1.35] font-semibold">
              {offer.label}
            </b>
            <span className="bg-surface-secondary text-ink-secondary rounded-md px-2 py-[3px] text-[12px] leading-[1.2] font-medium">
              {FAMILY_LABELS[offer.family] ?? offer.family}
            </span>
          </div>
          <p className="text-ink-secondary max-w-[54ch] text-[15px] leading-[1.55]">
            {offer.what}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-3">
          <OfferFigure
            value={formatEuroExact(offer.amount)}
            hint={tenorHint(offer)}
          />
          <OfferFigure
            accent
            value={formatRate(offer.annualRate)}
            hint={`${formatSignedBps(offer.spreadBps ?? 0)} sobre ${referenceLabel}`}
          />
        </div>
        <div className="min-w-[92px] md:text-right">
          <b className="block text-[20px] leading-[1.35] font-semibold tabular-nums">
            {formatNumber(offer.fit, 0)}
          </b>
          <small className="text-ink-secondary mt-0.5 block text-[13px] leading-[1.45]">
            encaje /100
          </small>
        </div>
      </div>
      <Disclosure className="mt-2">
        <Disclosure.Trigger className="text-ink-secondary flex items-center gap-2 text-[13px] leading-[1.45]">
          Ver detalle
          <Disclosure.Indicator />
        </Disclosure.Trigger>
        <Disclosure.Content>
          <Disclosure.Body className="pt-3">
            <OfferDetails offer={offer} variableLabels={variableLabels} />
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
    </div>
  );
}
