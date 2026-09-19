import { PriceBar, PriceSwatch } from '@/components/advisor/price-bar';
import {
  formatRate,
  formatSignedBps,
  RATE_KIND_LABELS,
} from '@/lib/advisor/format';
import type { AdvisorOffer } from '@/lib/advisor/types';
import { buildPriceSegments } from '@/lib/advisor/view';
import { formatNumber, formatPercent } from '@/lib/format';

interface OfferPriceProps {
  offer: AdvisorOffer;
}

/**
 * Explains the annual rate: the stacked bar of its components, what each one
 * pays for, whether the spread hit the band of the product and the expected
 * loss behind the risk premium.
 *
 * @param props - The offer being priced.
 * @returns The price block of an offer.
 */
export function OfferPrice({ offer }: OfferPriceProps) {
  const { pricing } = offer;
  const segments = buildPriceSegments(pricing.components);
  const barLabel = `${segments
    .map((segment) => `${segment.label} ${formatSignedBps(segment.bps)}`)
    .join('; ')}. Total ${formatRate(offer.annualRate)} anual.`;

  return (
    <div className="flex flex-col gap-3">
      <PriceBar segments={segments} label={barLabel} />
      <p className="text-right text-sm font-medium tabular-nums">
        {RATE_KIND_LABELS[offer.rateKind]} {formatRate(offer.annualRate)}
      </p>
      <ul className="flex flex-col gap-2">
        {segments.map((segment) => (
          <li key={segment.key} className="flex gap-2">
            <PriceSwatch segment={segment} />
            <span className="min-w-0">
              <span className="text-sm">
                {segment.label}{' '}
                <span className="tabular-nums">
                  {formatSignedBps(segment.bps)}
                </span>
              </span>
              <span className="block text-xs text-muted">{segment.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      {pricing.clamped && pricing.spreadBand && (
        <p className="text-xs text-muted">
          Diferencial ajustado a la banda del producto:{' '}
          {formatNumber(pricing.spreadBand[0])} a{' '}
          {formatNumber(pricing.spreadBand[1])} pb.
        </p>
      )}
      <p className="text-xs text-muted tabular-nums">
        Probabilidad de impago anual {formatPercent(pricing.annualPd, 1)} ·
        pérdida esperada {formatNumber(pricing.expectedLossBps)} pb
      </p>
    </div>
  );
}
