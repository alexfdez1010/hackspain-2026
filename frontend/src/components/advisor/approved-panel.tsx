import { OfferRow } from '@/components/advisor/offer-row';
import { Panel } from '@/components/ui/panel';
import type { AdvisorCompany } from '@/lib/advisor/types';
import { weakestPillar } from '@/lib/advisor/view';
import { formatMonth, formatNumber } from '@/lib/format';

/** Fit from which a product is offered at all. */
const OFFER_THRESHOLD = 40;

interface ApprovedPanelProps {
  company: AdvisorCompany;
  /** Spanish label of every pillar, keyed by pillar. */
  pillarLabels: Readonly<Record<string, string>>;
  /** Spanish label of every PULSE variable, keyed by variable. */
  variableLabels: Readonly<Record<string, string>>;
}

/**
 * Names the pillar the price is charging for, once, next to the offers.
 *
 * @param company - The company being advised.
 * @param pillarLabels - Spanish label of every pillar.
 * @returns The sentence, or `null` when no pillar has a score.
 */
function weakestSentence(
  company: AdvisorCompany,
  pillarLabels: Readonly<Record<string, string>>,
): string | null {
  const worst = weakestPillar(company.pillars, pillarLabels);
  if (!worst) return null;
  const label = worst.label.charAt(0).toLowerCase() + worst.label.slice(1);
  return `Tu pilar más débil es ${label}, en ${formatNumber(worst.score, 0)}.`;
}

/**
 * What the company can sign today: one line per approved product with its
 * amount, its price, its fit and the button that asks for it.
 *
 * The heading frames the catalogue as an option and not as a result — the
 * measure that costs nothing lives on the Acción page — and the sentence next
 * to it names, once, the pillar the price is charging for. What the rules
 * left out is a different reading, so it has a panel of its own; this one
 * closes with the only line of social proof the product shows.
 *
 * @param props - The company, the pillar labels and the variable labels.
 * @returns The panel that answers «¿qué puedo contratar?».
 */
export function ApprovedPanel({
  company,
  pillarLabels,
  variableLabels,
}: ApprovedPanelProps) {
  const { recommendations, improvementPlan } = company;
  const aside = weakestSentence(company, pillarLabels);
  return (
    <Panel>
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1 pb-1">
        <h3 className="text-[20px] leading-[1.35] font-semibold">
          Si necesitas financiación
        </h3>
        {aside && (
          <p className="text-ink-secondary text-[15px] leading-[1.55]">
            {aside}
          </p>
        )}
      </div>
      {recommendations.length > 0 ? (
        <div>
          {recommendations.map((offer) => (
            <OfferRow
              key={offer.product}
              offer={offer}
              referenceLabel={company.referenceRate.label}
              variableLabels={variableLabels}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 pt-5">
          <p className="max-w-[720px] text-[15px] leading-[1.55]">
            {`Hoy ningún producto supera el encaje mínimo de ${OFFER_THRESHOLD} con el PULSE de ${formatMonth(company.month)}`}
          </p>
          <ul className="text-ink-secondary flex max-w-[720px] flex-col gap-2 text-[15px] leading-[1.55]">
            {improvementPlan.unlocks.map((unlock) => (
              <li key={unlock} className="flex gap-3">
                <span aria-hidden="true" className="shrink-0">
                  –
                </span>
                <span>{unlock}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-ink-secondary mt-5 text-[13px] leading-[1.45]">
        +500 equipos financieros confían en nosotros
      </p>
    </Panel>
  );
}
