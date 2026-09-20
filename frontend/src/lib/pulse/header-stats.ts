import type { StatItem } from '@/components/ui/stat-grid';
import type { ClientHealth } from '@/lib/pulse/client-health';
import { formatConfidence, formatWeightPoints } from '@/lib/pulse/format';
import type { PulseCompany } from '@/lib/pulse/types';
import { scoreBand } from '@/lib/score';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatSigned,
} from '@/lib/format';

/** Key of the variable that measures how long the cash lasts. */
export const CASH_DAYS_KEY = 'cash_days';

/** Everything the four headline figures read, from three data sources. */
export interface PulseHeaderInput {
  company: PulseCompany;
  /** Mean payment health of the customers; `null` when no detail is published. */
  clientHealth: ClientHealth | null;
  /** Cash at the end of the last observed month, in euros. */
  cashEnd: number | null;
}

/**
 * Days of cash measured in the last observed month.
 *
 * @param company - Company being read.
 * @returns The raw figure, or `null` when the month has no evidence.
 */
export function cashDays(company: PulseCompany): number | null {
  const last = company.series[company.series.length - 1];
  const value = last?.variables[CASH_DAYS_KEY];
  return value?.known ? value.raw : null;
}

/**
 * Says how many customers the health figure rests on and where it sits.
 *
 * @param health - The customers' figure, or `null` without detail.
 * @returns The hint under the figure.
 */
export function clientHealthHint(health: ClientHealth | null): string {
  if (!health) return 'Sin detalle de clientes publicado';
  if (health.score === null || health.customers === 0)
    return 'Sin clientes con facturas en 6 meses';
  const plural = health.customers === 1 ? 'cliente' : 'clientes';
  return `${scoreBand(health.score).name} · ${formatNumber(health.customers)} ${plural} por facturación`;
}

/**
 * What every figure of the strip means, in the words a finance team uses.
 *
 * They are the tooltips of the prototype: the labels stay short because the
 * definition lives one hover away, so the strip never turns into a glossary.
 */
const TIPS = {
  change:
    'Cuántos puntos ha subido o bajado el PULSE respecto al cierre anterior.',
  confidence: 'Porcentaje del peso del modelo que tiene dato este mes.',
  clients:
    'Score de 0 a 100 de la salud financiera de tus clientes. Bajo significa que quien te debe dinero está peor que la media.',
  cash: 'Días que aguantas pagando lo de siempre sin que entre un euro nuevo.',
} as const;

/**
 * Explains the confidence figure with the two numbers that make it actionable:
 * the share of weight with data and the points of weight missing.
 *
 * The second sentence only appears when there is a figure to name, because
 * «faltan — puntos» would read as a bug rather than as an unknown coverage.
 *
 * @param confidence - Ratio between 0 and 1; `null` when unknown.
 * @returns The tooltip of the confidence cell.
 */
export function confidenceTip(confidence: number | null): string {
  if (confidence === null || !Number.isFinite(confidence)) {
    return TIPS.confidence;
  }
  const missing = 100 - confidence * 100;
  return (
    `${TIPS.confidence} Al ${formatConfidence(confidence)} faltan ` +
    `${formatNumber(missing)} puntos de peso: el PULSE se calcula solo con lo que hay.`
  );
}

/**
 * Builds the four figures that qualify the headline score.
 *
 * Each one answers a question the score alone cannot: where it came from, how
 * much of it rests on data, how the customers it depends on are paying and
 * how long the cash lasts if nothing changes. The six-month stress
 * probability stays out on purpose: the price of the offers already charges
 * for it and the actions block names it when it changes what to do.
 *
 * Each one also carries its definition as a tooltip, so «Salud de tus
 * clientes» or «Días de caja» can be read by someone who has never seen the
 * model without spending a line of the strip on explaining it.
 *
 * @param input - The company, its customers' health and its cash.
 * @returns The four figures, in reading order.
 */
export function buildHeaderStats({
  company,
  clientHealth,
  cashEnd,
}: PulseHeaderInput): StatItem[] {
  const previousMonth = company.series[company.series.length - 2]?.month ?? '';
  const change =
    company.pulse !== null && company.pulsePrev !== null
      ? company.pulse - company.pulsePrev
      : null;
  const days = cashDays(company);
  return [
    {
      key: 'change',
      label: 'Variación vs mes anterior',
      value: formatSigned(change),
      hint:
        company.pulsePrev === null || !previousMonth
          ? 'Sin mes anterior observado'
          : `Desde ${formatNumber(company.pulsePrev, 1)} puntos en ${formatMonth(previousMonth)}`,
      tip: TIPS.change,
    },
    {
      key: 'confidence',
      label: 'Confianza del dato',
      value: formatConfidence(company.confidence),
      hint: formatWeightPoints(company.confidence),
      tip: confidenceTip(company.confidence),
    },
    {
      key: 'clients',
      label: 'Salud de tus clientes',
      value:
        clientHealth?.score === null || clientHealth === null
          ? '—'
          : formatNumber(clientHealth.score, 1),
      hint: clientHealthHint(clientHealth),
      tip: TIPS.clients,
    },
    {
      key: 'cash',
      label: 'Días de caja',
      value: days === null ? '—' : formatNumber(days, 1),
      hint:
        cashEnd === null
          ? 'Sin caja exportada'
          : `${formatEuro(cashEnd)} en caja`,
      tip: TIPS.cash,
    },
  ];
}
