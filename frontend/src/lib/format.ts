const LOCALE = 'es-ES';

const MONTH_NAMES_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

/**
 * Formats a number with Spanish separators.
 *
 * @param value - Number to format; `null` renders as an em dash.
 * @param digits - Fraction digits, fixed for both minimum and maximum.
 * @returns A localized string, or `—` when there is no value.
 */
export function formatNumber(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Formats a count with a thousands separator even at four digits.
 *
 * `es-ES` leaves «1285» ungrouped because Spanish only groups from five
 * digits; a count of companies reads as a year that way, so the portfolio
 * size is always grouped, as the legal pages write it («1.285»).
 *
 * @param value - Count to format; `null` renders as an em dash.
 * @returns A localized string such as `1.285`.
 */
export function formatCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString(LOCALE, {
    maximumFractionDigits: 0,
    useGrouping: 'always',
  });
}

/**
 * Formats an amount in euros, using compact notation above 10.000 €.
 *
 * The number is formatted on its own and the euro sign appended by hand
 * after a no-break space, as the currency style does:
 * the ICU builds of Node and Chromium disagree on the space between a
 * compact unit and the currency (`3,6 M €` against `3,6 M€`), and a page
 * rendered on the server must hydrate byte for byte in the browser.
 *
 * @param value - Amount in euros; `null` renders as an em dash.
 * @returns A localized string such as `2636 €`, `37 mil €` or `3,6 M €`.
 */
export function formatEuro(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const compact = Math.abs(value) >= 10_000;
  const amount = value.toLocaleString(LOCALE, {
    notation: compact ? 'compact' : 'standard',
    maximumFractionDigits: compact ? 1 : 0,
  });
  return `${amount}\u00a0€`;
}

/**
 * Formats a 0-1 ratio as a percentage.
 *
 * @param value - Ratio between 0 and 1; `null` renders as an em dash.
 * @param digits - Fraction digits of the percentage.
 * @returns A localized percentage string.
 */
export function formatPercent(value: number | null, digits = 0): string {
  if (value === null || !Number.isFinite(value)) return '—';
  return value.toLocaleString(LOCALE, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * Formats a signed delta, always showing the sign so direction is unambiguous.
 *
 * @param value - Delta to format; `null` renders as an em dash.
 * @param digits - Fraction digits.
 * @returns A localized signed string.
 */
export function formatSigned(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) return '—';
  const formatted = Math.abs(value).toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

/**
 * Renders a `YYYY-MM` key as a short Spanish month label.
 *
 * @param month - Month key such as `2026-08`.
 * @returns A label such as `ago 2026`, or the input when it is malformed.
 */
export function formatMonth(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  const index = Number(match[2]) - 1;
  const name = MONTH_NAMES_ES[index];
  return name ? `${name} ${match[1]}` : month;
}

/**
 * Renders a `YYYY-MM` key as a compact axis label without the year.
 *
 * @param month - Month key such as `2026-08`.
 * @returns A label such as `ago`, or the input when it is malformed.
 */
export function formatMonthShort(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return month;
  return MONTH_NAMES_ES[Number(match[2]) - 1] ?? month;
}
