import { formatEuroExact } from '@/lib/advisor/format';
import type { AdvisorSizing } from '@/lib/advisor/types';
import { formatNumber, formatPercent } from '@/lib/format';

/** Spanish label of every input the sizing formulas read. */
export const SIZING_INPUT_LABELS: Record<string, string> = {
  cover_months: 'Meses de pagos cubiertos',
  monthly_outflow: 'Pagos operativos al mes',
  line_available: 'Disponible en líneas',
  line_limit: 'Límite actual de líneas',
  increase_factor: 'Factor de ampliación',
  advance_rate: 'Anticipo',
  eligible_ar: 'Facturas anticipables',
  ar_monthly: 'Facturación mensual',
  months_of_purchases: 'Meses de compras cubiertos',
  ap_monthly: 'Compras mensuales',
  months_of_collections: 'Meses de cobros',
  monthly_collections: 'Cobros al mes',
  pulse_factor: 'Factor por PULSE',
  loan_outstanding: 'Saldo vivo de préstamos',
  service_3m: 'Vencimientos a 3 meses',
  cash_end: 'Caja a cierre de mes',
  operating_buffer: 'Colchón operativo reservado',
  cash_days: 'Días de caja',
};

/** Inputs expressed as a share between 0 and 1. */
const RATIO_KEYS = new Set(['advance_rate', 'pulse_factor', 'increase_factor']);

/** Inputs expressed in months. */
const MONTH_KEYS = new Set([
  'cover_months',
  'months_of_purchases',
  'months_of_collections',
]);

/**
 * Turns a snake_case key from the backend into a readable label.
 *
 * @param key - Key as published, such as `cover_months`.
 * @returns The Spanish label, or the humanised key when it is not mapped.
 */
export function sizingInputLabel(key: string): string {
  const known = SIZING_INPUT_LABELS[key];
  if (known) return known;
  const words = key.replace(/_/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

/**
 * Renders a sizing input in the unit its key implies.
 *
 * @param key - Key of the input.
 * @param value - Figure as published.
 * @returns A formatted figure: a share, a number of months, days or euros.
 */
export function formatSizingInput(key: string, value: number): string {
  if (RATIO_KEYS.has(key)) return formatPercent(value, 0);
  if (MONTH_KEYS.has(key)) {
    return `${formatNumber(value, 2)} ${value === 1 ? 'mes' : 'meses'}`;
  }
  if (key === 'cash_days') return `${formatNumber(value, 0)} días`;
  return formatEuroExact(value);
}

/** One line of the amount breakdown. */
export interface SizingRow {
  key: string;
  label: string;
  value: string;
}

/**
 * Builds the definition list that backs the amount of an offer.
 *
 * @param sizing - Formula and inputs of the offer.
 * @returns One row per input, in the order the backend published them.
 */
export function buildSizingRows(sizing: AdvisorSizing): SizingRow[] {
  return Object.entries(sizing.inputs).map(([key, value]) => ({
    key,
    label: sizingInputLabel(key),
    value: formatSizingInput(key, value),
  }));
}
