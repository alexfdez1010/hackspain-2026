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
 * Builds the four figures that qualify the headline score.
 *
 * Each one answers a question the score alone cannot: where it came from, how
 * much of it rests on data, how the customers it depends on are paying and
 * how long the cash lasts if nothing changes. The six-month stress
 * probability stays out on purpose: the price of the offers already charges
 * for it and the actions block names it when it changes what to do.
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
    },
    {
      key: 'confidence',
      label: 'Confianza del dato',
      value: formatConfidence(company.confidence),
      hint: formatWeightPoints(company.confidence),
    },
    {
      key: 'clients',
      label: 'Salud de los clientes',
      value:
        clientHealth?.score === null || clientHealth === null
          ? '—'
          : formatNumber(clientHealth.score, 1),
      hint: clientHealthHint(clientHealth),
    },
    {
      key: 'cash',
      label: 'Días de caja',
      value: days === null ? '—' : formatNumber(days, 1),
      hint:
        cashEnd === null
          ? 'Sin caja exportada'
          : `${formatEuro(cashEnd)} al cierre`,
    },
  ];
}
