import { Disclosure } from '@heroui/react';

import { OfferDetails } from '@/components/advisor/offer-details';
import { RequestProposalButton } from '@/components/advisor/request-proposal-button';
import { InfoTip } from '@/components/ui/info-tip';
import {
  FAMILY_LABELS,
  formatEuroExact,
  formatRate,
  formatSignedBps,
  formatTenor,
} from '@/lib/advisor/format';
import type { AdvisorOffer } from '@/lib/advisor/types';
import { formatNumber } from '@/lib/format';

/**
 * What the amount and the fit mean, on hover. The three figures of the row
 * carry no legend of their own, so the sentence that would clutter the line
 * lives in the tooltip instead.
 */
const AMOUNT_TIP = 'Importe máximo que el modelo aprueba hoy con tu PULSE.';
const FIT_TIP =
  'De 0 a 100: lo bien que este producto encaja con tu situación de caja.';

interface OfferFigureProps {
  /** What the figure is called; names its info button. */
  label: string;
  value: string;
  hint: string;
  /** What the figure means, behind the info button beside it. */
  tip: string;
  /** `true` for the price, the only figure of the row that carries colour. */
  accent?: boolean;
}

/**
 * A figure of the row with the line that qualifies it.
 *
 * The cell never wraps: the columns are sized for the longest figure of the
 * catalogue, so a stray line break would break the alignment of the grid.
 *
 * @param props - The figure, its qualifier, its definition and whether it is
 *   the price.
 * @returns The stacked pair, as one cell of the row.
 */
function OfferFigure({
  label,
  value,
  hint,
  tip,
  accent = false,
}: OfferFigureProps) {
  return (
    <span className="whitespace-nowrap">
      <span className="flex items-center gap-1.5">
        <b
          className={`text-[17px] leading-[1.35] font-semibold tabular-nums ${accent ? 'text-link-accent' : ''}`.trim()}
        >
          {value}
        </b>
        <InfoTip label={label}>{tip}</InfoTip>
      </span>
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
 * and for how long, at what price, how well it fits, and the button that
 * asks for it. The family and the one-line description sit under the figures,
 * and the argument behind the offer — why it fits, how the amount was sized,
 * what the price pays for and what would make it cheaper — folds away under
 * «Ver detalle», so nothing is lost and nothing competes with the decision.
 *
 * The only line drawn is the hairline that separates one product from the
 * previous one; the first row of the panel has none, because the space under
 * the heading already groups it.
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
    <div className="border-hairline border-t py-5 first:border-t-0">
      <div className="flex flex-col gap-y-4 md:grid md:grid-cols-[minmax(0,1fr)_128px_104px_96px_176px] md:items-center md:gap-x-8 md:gap-y-0">
        <b className="min-w-0 text-[20px] leading-[1.35] font-semibold">
          {offer.label}
        </b>
        <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 md:order-last md:col-span-5 md:mt-2.5">
          <span className="bg-surface-secondary text-ink-secondary rounded-md px-2 py-[3px] text-[12px] leading-[1.2] font-medium whitespace-nowrap">
            {FAMILY_LABELS[offer.family] ?? offer.family}
          </span>
          <span className="text-ink-secondary text-[15px] leading-[1.55]">
            {offer.what}
          </span>
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-3 md:contents">
          <OfferFigure
            label="Importe"
            tip={AMOUNT_TIP}
            value={formatEuroExact(offer.amount)}
            hint={tenorHint(offer)}
          />
          <OfferFigure
            accent
            label="Tipo"
            tip={`Tipo de interés anual indicativo. Debajo, ${formatSignedBps(offer.spreadBps ?? 0)} es lo que se suma al ${referenceLabel} por tu perfil de riesgo.`}
            value={formatRate(offer.annualRate)}
            hint={formatSignedBps(offer.spreadBps ?? 0)}
          />
          <OfferFigure
            label="Encaje"
            tip={FIT_TIP}
            value={formatNumber(offer.fit, 0)}
            hint="encaje /100"
          />
        </div>
        <RequestProposalButton
          productLabel={offer.label}
          amount={formatEuroExact(offer.amount)}
          tenor={formatTenor(offer.tenorMonths)}
        />
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
