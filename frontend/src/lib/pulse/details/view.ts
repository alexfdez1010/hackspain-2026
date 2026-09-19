import { formatMonth, formatNumber, formatSigned } from '@/lib/format';
import type { DetailMonth } from '@/lib/pulse/details/types';

/**
 * Heading of the detail section of each variable. Each one names what the
 * drill-down shows, so the reader knows before scrolling whether the answer
 * is a counterparty ranking, a daily series or a debt schedule.
 */
export const DETAIL_TITLES: Readonly<Record<string, string>> = {
  cash_days: 'Caja diaria y cuentas',
  cash_min: 'Peor día del mes',
  loc_util: 'Líneas de crédito',
  loc_accel: 'Ritmo de utilización',
  dpo: 'Proveedores y cómo se les paga',
  terms: 'Plazos por proveedor',
  dso: 'Clientes y cómo pagan',
  ar90: 'Antigüedad de la cartera',
  top_client: 'Concentración de clientes',
  maturities: 'Deuda y servicio',
  network: 'Salud de pago de los clientes',
};

/**
 * Names the detail section of one variable.
 *
 * @param key - Variable key of the export, such as `network`.
 * @returns The heading, or `null` when the variable has no detail block.
 */
export function detailTitle(key: string): string | null {
  return DETAIL_TITLES[key] ?? null;
}

/** Who is late: the company paying a supplier, or a customer paying it. */
export type LatePartySubject = 'supplier' | 'customer';

/**
 * Writes what the signed late days mean for one counterparty.
 *
 * @param days - Days after the due date; negative when paid early.
 * @param subject - Whether the counterparty is a supplier or a customer.
 * @returns A phrase such as `Se le paga 20,0 días pronto`.
 */
export function lateDaysHint(
  days: number | null,
  subject: LatePartySubject,
): string {
  const verb = subject === 'supplier' ? 'Se le paga' : 'Paga';
  if (days === null || !Number.isFinite(days)) {
    return `${verb} sin facturas cerradas`;
  }
  const magnitude = `${formatNumber(Math.abs(days), 1)} días`;
  if (days > 0) return `${verb} ${magnitude} tarde`;
  if (days < 0) return `${verb} ${magnitude} pronto`;
  return `${verb} en plazo`;
}

/**
 * Renders an ISO day as a short Spanish date.
 *
 * @param day - Day such as `2026-08-11`.
 * @returns A label such as `11 ago 2026`, or the input when it is malformed.
 */
export function formatDay(day: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!match) return day;
  const key = `${match[1]}-${match[2]}`;
  const month = formatMonth(key);
  if (month === key) return day;
  return `${Number(match[3])} ${month}`;
}

/**
 * Renders the growth of a customer, which the export clips to ±100 %.
 *
 * @param growth - Growth of the quarter over the previous one.
 * @returns A signed percentage, or `sin base` when there is no base quarter.
 */
export function growthText(growth: number | null): string {
  if (growth === null || !Number.isFinite(growth)) return 'sin base';
  return `${formatSigned(growth * 100, 0)} %`;
}

/**
 * Reads the last month of a detail block.
 *
 * @param months - Months of the block, ascending.
 * @returns The most recent month, or `null` when the block has none.
 */
export function lastDetailMonth(
  months: readonly DetailMonth[],
): DetailMonth | null {
  return months.length > 0 ? months[months.length - 1] : null;
}

/**
 * Reads one column of the last month of a detail block.
 *
 * @param months - Months of the block, ascending.
 * @param key - Camel-case column name, such as `cashEnd`.
 * @returns The value, or `null` when the month or the column is missing.
 */
export function lastValue(
  months: readonly DetailMonth[],
  key: string,
): number | null {
  return lastDetailMonth(months)?.values[key] ?? null;
}

/**
 * Reads the last utilisation move as one sentence.
 *
 * @param utilD3 - Change of the utilisation over three months, as a ratio.
 * @param accel - Change of that change, as a ratio.
 * @returns A sentence naming both moves in points of utilisation.
 */
export function accelSentence(
  utilD3: number | null,
  accel: number | null,
): string {
  if (utilD3 === null && accel === null) {
    return 'Sin utilización medida: la variable no entra en el PULSE de este mes.';
  }
  const move =
    utilD3 === null
      ? 'La utilización no tiene tres meses comparables'
      : `La utilización ${utilD3 >= 0 ? 'sube' : 'baja'} ${formatNumber(Math.abs(utilD3 * 100), 1)} puntos en 3 meses`;
  const pace =
    accel === null
      ? 'sin ritmo comparable'
      : `ese ritmo se ${accel >= 0 ? 'acelera' : 'frena'} ${formatNumber(Math.abs(accel * 100), 1)} puntos`;
  return `${move} y ${pace}.`;
}
