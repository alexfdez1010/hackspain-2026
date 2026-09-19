import type { StatItem } from '@/components/ui/stat-grid';
import { formatConfidence, formatWeightPoints } from '@/lib/pulse/format';
import type { PulseCompany } from '@/lib/pulse/types';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatSigned,
} from '@/lib/format';

/** Key of the variable that measures how long the cash lasts. */
export const CASH_DAYS_KEY = 'cash_days';

/** Everything the three headline figures read, from two data sources. */
export interface PulseHeaderInput {
  company: PulseCompany;
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
 * Builds the three figures that qualify the headline score.
 *
 * Each one answers a question the score alone cannot: where it came from, how
 * much of it rests on data and how long the cash lasts if nothing changes.
 * The six-month stress probability stays out on purpose: the price of the
 * offers already charges for it and the actions block names it when it
 * changes what to do.
 *
 * @param input - The company and its cash.
 * @returns The three figures, in reading order.
 */
export function buildHeaderStats({
  company,
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
