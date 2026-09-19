import type { PulseForecastHorizonEvaluation } from '@/lib/pulse/types';
import { formatNumber } from '@/lib/format';

/** Horizon the plain-language summary of the forecast is read at. */
export const OUTLOOK_HORIZON = 6;

/**
 * Picks the evaluated horizon closest to the one the summary talks about.
 *
 * @param horizons - Evaluated horizons, any order.
 * @param preferred - Horizon in months the summary prefers.
 * @returns The closest evaluated horizon, or `null` when there is none.
 */
export function pickOutlookHorizon(
  horizons: readonly PulseForecastHorizonEvaluation[],
  preferred = OUTLOOK_HORIZON,
): PulseForecastHorizonEvaluation | null {
  let best: PulseForecastHorizonEvaluation | null = null;
  for (const row of horizons) {
    if (
      best === null ||
      Math.abs(row.horizon - preferred) < Math.abs(best.horizon - preferred)
    ) {
      best = row;
    }
  }
  return best;
}

/**
 * Says a recall as «7 de cada 10», which needs no statistics to read.
 *
 * @param recall - Share of the events the model saw coming, 0 to 1.
 * @returns The sentence fragment, or `null` when the recall is unknown.
 */
export function describeHits(recall: number | null): string | null {
  if (recall === null || Number.isNaN(recall)) return null;
  const hits = Math.round(Math.min(Math.max(recall, 0), 1) * 10);
  return `${formatNumber(hits)} de cada 10`;
}
