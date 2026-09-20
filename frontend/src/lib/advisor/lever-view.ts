import { formatRate, formatSignedBps } from '@/lib/advisor/format';
import type {
  AdvisorCompany,
  AdvisorLever,
  AdvisorOffer,
} from '@/lib/advisor/types';
import { sortLevers } from '@/lib/advisor/view';
import { formatNumber, formatPercent } from '@/lib/format';

/** Colour role of a figure over the navy block. */
export type LeverTileTone = 'plain' | 'good' | 'bad' | 'sky';

/** One figure of the strip under the lever headline. */
export interface LeverTile {
  key: string;
  value: string;
  label: string;
  /** Plain-language definition, opened from the info button. */
  tip: string;
  tone: LeverTileTone;
}

/** The navy block of the financing page: the counterfactual and its context. */
export interface LeverHeadlineView {
  /** «Con el pilar de liquidez en 60 en vez de 34, tu prima baja 395 pb.» */
  headline: string;
  /** What the scenario assumes and what it does to the stress probability. */
  note: string | null;
  tiles: LeverTile[];
}

/**
 * Names a pillar the way the sentence needs it: «liquidez», not «Pilar
 * liquidez».
 *
 * @param label - Label of the lever as the backend publishes it.
 * @returns The pillar name in lower case, without the «Pilar» prefix.
 */
export function pillarPhrase(label: string): string {
  return label.replace(/^pilar\s+/i, '').toLowerCase();
}

/**
 * The offer with the lowest annual rate, the one worth quoting as «best».
 *
 * @param offers - Approved offers of the company.
 * @returns The cheapest offer, or `null` without offers or without rates.
 */
export function cheapestOffer(
  offers: readonly AdvisorOffer[],
): AdvisorOffer | null {
  return offers.reduce<AdvisorOffer | null>((best, offer) => {
    if (offer.annualRate === null) return best;
    if (best === null || (best.annualRate ?? Infinity) > offer.annualRate)
      return offer;
    return best;
  }, null);
}

/**
 * Writes the headline of the lever: the pillar to move, from where to where,
 * and the basis points it takes off the premium.
 *
 * @param lever - The lever with the largest saving.
 * @returns The sentence of the prototype, with the figures of the company.
 */
function leverHeadline(lever: AdvisorLever): string {
  return (
    `Con el pilar de ${pillarPhrase(lever.label)} en ${formatNumber(lever.target)} ` +
    `en vez de ${formatNumber(lever.current)}, tu prima de riesgo baja ` +
    `${formatNumber(lever.premiumSavingBps)} puntos básicos.`
  );
}

/**
 * Writes what the scenario assumes and what it does to the stress figure.
 *
 * @param lever - The lever with the largest saving.
 * @returns The note, or `null` when the model published no probabilities.
 */
function leverNote(lever: AdvisorLever): string | null {
  if (lever.pStressNow === null || lever.pStressThen === null) return null;
  return (
    `Hoy tu ${pillarPhrase(lever.label)} está en ${formatNumber(lever.current, 1)}. ` +
    'El escenario supone que el resto de variables no se mueven, y con él la ' +
    `probabilidad de tensión a seis meses pasa del ${formatPercent(lever.pStressNow, 0)} ` +
    `al ${formatPercent(lever.pStressThen, 0)}.`
  );
}

/**
 * Builds the three figures under the headline: the stress probability against
 * the portfolio, how much of the catalogue fits and the best price on offer.
 *
 * @param company - The company being advised.
 * @returns The tiles, in reading order.
 */
export function buildLeverTiles(company: AdvisorCompany): LeverTile[] {
  const { risk, recommendations, declined, referenceRate } = company;
  const catalogue = recommendations.length + declined.length;
  const best = cheapestOffer(recommendations);
  const belowPortfolio =
    risk.pStress6m !== null &&
    risk.baseRate !== null &&
    risk.pStress6m <= risk.baseRate;
  return [
    {
      key: 'stress',
      value: formatPercent(risk.pStress6m, 0),
      label: 'Probabilidad de tensión a 6 meses',
      tip:
        'Probabilidad de que te quedes sin caja para pagar algo en los próximos seis meses.' +
        (risk.baseRate === null
          ? ''
          : ` La media de la cartera es ${formatPercent(risk.baseRate, 0)}.`),
      tone: risk.pStress6m === null ? 'plain' : belowPortfolio ? 'good' : 'bad',
    },
    {
      key: 'fit',
      value: `${formatNumber(recommendations.length)} de ${formatNumber(catalogue)}`,
      label: 'Productos que encajan hoy',
      tip: `De los ${formatNumber(catalogue)} productos del catálogo, los que el modelo aprueba con tu PULSE actual.`,
      tone: 'plain',
    },
    {
      key: 'rate',
      value: best ? formatRate(best.annualRate) : '—',
      label: best
        ? `Mejor tipo ofrecido, ${formatSignedBps(best.spreadBps ?? 0)} sobre ${referenceRate.label}`
        : 'Sin tipo ofrecido hoy',
      tip: best
        ? `El tipo más bajo que te ofrecen hoy. ${formatSignedBps(best.spreadBps ?? 0)} es lo que se suma al ${referenceRate.label} por tu perfil de riesgo.`
        : 'Ningún producto supera hoy el encaje mínimo, así que no hay tipo que ofrecer.',
      tone: best ? 'sky' : 'plain',
    },
  ];
}

/**
 * Builds the navy block of the financing page from the company's levers.
 *
 * The headline is the counterfactual with the largest saving, written with
 * the pillar's figures, so the page says in one sentence what the price is
 * charging for and what would make it cheaper. Without a lever that saves
 * anything there is no block: a sentence about a premium that cannot fall
 * would be filler.
 *
 * @param company - The company being advised.
 * @returns The block, or `null` when no lever lowers the premium.
 */
export function buildLeverHeadline(
  company: AdvisorCompany,
): LeverHeadlineView | null {
  const lever = sortLevers(company.improvementPlan.levers)[0];
  if (!lever || (lever.premiumSavingBps ?? 0) <= 0) return null;
  if (lever.current === null || lever.target === null) return null;
  return {
    headline: leverHeadline(lever),
    note: leverNote(lever),
    tiles: buildLeverTiles(company),
  };
}
