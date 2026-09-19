import { formatNumber, formatPercent } from '@/lib/format';

/** Rendered when a variable has no evidence in the month. */
export const UNKNOWN_TEXT = 'sin datos';

/**
 * Renders a raw figure with the unit declared by the score metadata.
 *
 * Units that start with `%` carry a share between 0 and 1, so they are rendered
 * as a percentage; everything else is a plain magnitude followed by its unit.
 *
 * @param value - Raw figure; `null` means the month has no evidence.
 * @param unit - Unit string coming from the dataset, such as `días`.
 * @returns The formatted figure, or `sin datos` when there is none.
 */
export function formatRawValue(value: number | null, unit: string): string {
  if (value === null || !Number.isFinite(value)) return UNKNOWN_TEXT;
  if (unit.startsWith('%')) {
    const tail = unit.slice(1).trim();
    return tail
      ? `${formatPercent(value, 1)} ${tail}`
      : formatPercent(value, 1);
  }
  if (unit === 'días') return `${formatNumber(value, 1)} días`;
  return unit ? `${formatNumber(value, 2)} ${unit}` : formatNumber(value, 2);
}

/**
 * Renders the confidence as the share of the 100 points backed by data.
 *
 * @param confidence - Ratio between 0 and 1; `null` renders as an em dash.
 * @returns A percentage string such as `82 %`.
 */
export function formatConfidence(confidence: number | null): string {
  return formatPercent(confidence, 0);
}

/**
 * Renders the number of points of the score that rest on observed data.
 *
 * @param confidence - Ratio between 0 and 1.
 * @returns A sentence such as `82 de 100 puntos con datos`.
 */
export function formatConfidencePoints(confidence: number | null): string {
  if (confidence === null || !Number.isFinite(confidence)) {
    return 'Sin cobertura conocida';
  }
  return `${formatNumber(confidence * 100)} de 100 puntos con datos`;
}

/**
 * Renders the confidence as points of weight, naming what the 100 are.
 *
 * The company view repeats this sentence under every confidence figure, so it
 * says «puntos de peso» in full: the 100 are the weights of the eleven
 * variables, not a percentage of anything else.
 *
 * @param confidence - Ratio between 0 and 1.
 * @returns A sentence such as `82 de 100 puntos de peso con datos`.
 */
export function formatWeightPoints(confidence: number | null): string {
  if (confidence === null || !Number.isFinite(confidence)) {
    return 'Sin cobertura conocida';
  }
  return `${formatNumber(confidence * 100)} de 100 puntos de peso con datos`;
}

/**
 * Renders a forecast horizon.
 *
 * @param horizon - Horizon in months.
 * @returns A label such as `+6 m`.
 */
export function formatHorizon(horizon: number): string {
  return `+${formatNumber(horizon)} m`;
}

/**
 * Renders a prediction interval.
 *
 * @param p10 - Lower bound of the 80 % band.
 * @param p90 - Upper bound of the 80 % band.
 * @returns A range such as `15,6-48,4`, or an em dash when incomplete.
 */
export function formatBand(p10: number | null, p90: number | null): string {
  if (p10 === null || p90 === null) return '—';
  return `${formatNumber(p10, 1)}-${formatNumber(p90, 1)}`;
}
