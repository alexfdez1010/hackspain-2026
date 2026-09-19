import { formatNumber, formatPercent, formatSigned } from '@/lib/format';
import { formatRawValue } from '@/lib/pulse/format';
import type {
  AdvisorDeclineStatus,
  AdvisorRateKind,
  AdvisorReasonKind,
} from '@/lib/advisor/types';

const LOCALE = 'es-ES';

/**
 * Renders an annual rate given as a decimal.
 *
 * @param rate - Annual decimal such as `0.0917`; `null` renders as an em dash.
 * @returns A percentage with two decimals, such as `9,17 %`.
 */
export function formatRate(rate: number | null): string {
  return formatPercent(rate, 2);
}

/**
 * Renders an amount in euros without compact notation, for offers.
 *
 * @param value - Amount in euros; `null` renders as an em dash.
 * @returns A string such as `25.000 €`.
 */
export function formatEuroExact(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString(LOCALE, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

/**
 * Renders a signed spread in basis points.
 *
 * @param bps - Basis points; negative for a discount.
 * @returns A string such as `+544 pb` or `−60 pb`.
 */
export function formatSignedBps(bps: number): string {
  const magnitude = formatNumber(Math.abs(bps));
  if (bps > 0) return `+${magnitude} pb`;
  if (bps < 0) return `−${magnitude} pb`;
  return `${magnitude} pb`;
}

/**
 * Renders a tenor in months.
 *
 * @param months - Tenor; `null` renders as an em dash.
 * @returns A string such as `12 meses`.
 */
export function formatTenor(months: number | null): string {
  if (months === null || !Number.isFinite(months)) return '—';
  return `${formatNumber(months)} ${months === 1 ? 'mes' : 'meses'}`;
}

/** What the annual rate means for the company, by product kind. */
export const RATE_KIND_LABELS: Record<AdvisorRateKind, string> = {
  cost: 'Tipo anual',
  yield: 'Remuneración anual',
};

/** Spanish labels of the reason kinds. */
export const REASON_KIND_LABELS: Record<AdvisorReasonKind, string> = {
  pro: 'A favor',
  contra: 'En contra',
  bloqueo: 'Bloquea',
};

/** Spanish labels of the product families. */
export const FAMILY_LABELS: Record<string, string> = {
  circulante: 'Circulante',
  cobros: 'Cobros',
  pagos: 'Pagos',
  plazo: 'Plazo',
  tesoreria: 'Tesorería',
};

/** Spanish labels of the reasons a product was left out. */
export const DECLINE_STATUS_LABELS: Record<AdvisorDeclineStatus, string> = {
  no_elegible: 'No elegible',
  poco_encaje: 'Poco encaje',
};

/**
 * Renders the figure a reason quotes, in the unit the rule declared.
 *
 * Units the score metadata does not know (euros, a rate, PULSE points) are
 * rendered here; everything else falls back to the shared raw-value renderer
 * so a figure reads the same in the advisor and in the score views.
 *
 * @param value - Figure behind the reason; `null` when the rule reads no
 * variable.
 * @param unit - Unit published with the reason, such as `días` or `EUR/mes`.
 * @returns The formatted figure, or `null` when there is nothing to print.
 */
export function formatReasonValue(
  value: number | null,
  unit: string | null,
): string | null {
  if (value === null || !Number.isFinite(value) || !unit) return null;
  if (unit === 'EUR') return formatEuroExact(value);
  if (unit === 'EUR/mes') return `${formatEuroExact(value)}/mes`;
  if (unit === 'tipo anual') return formatRate(value);
  if (unit === 'PULSE') return `${formatNumber(value, 1)} PULSE`;
  if (unit === 'puntos PULSE a +6 m') {
    return `${formatSigned(value, 1)} puntos PULSE a +6 m`;
  }
  return formatRawValue(value, unit);
}
