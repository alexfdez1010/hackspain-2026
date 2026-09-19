import type {
  PulseForecastPoint,
  PulsePillars,
  PulseSeriesPoint,
} from '@/lib/pulse/types';

/** One observed month as the month-by-month table reads it. */
export interface PulseMonthRow {
  month: string;
  pulse: number | null;
  /** Change against the previous observed month; `null` for the first one. */
  change: number | null;
  confidence: number | null;
  pillars: PulsePillars;
  /** Cash balance at the end of the month, in euros. */
  cashEnd: number | null;
  /** Variables the month carries no evidence for. */
  unknownCount: number;
}

/** One forecast horizon as the month-by-month table reads it. */
export interface PulseForecastRow {
  horizon: number;
  targetMonth: string;
  pulsePred: number | null;
  pulseP10: number | null;
  pulseP90: number | null;
  /** Change the horizon implies against the last observed score. */
  change: number | null;
  /** Predicted change of PULSE, which the decomposition sums to. */
  delta: number | null;
}

/**
 * Counts the variables of a month that carry no evidence.
 *
 * @param point - Observed month.
 * @returns How many of the month's variables are unknown.
 */
function countUnknown(point: PulseSeriesPoint): number {
  return Object.values(point.variables).filter((value) => !value.known).length;
}

/**
 * Builds one row per observed month, most recent first.
 *
 * The change of each row is always measured against the month that precedes it
 * in time, whatever the order the rows are read in, and the first observed
 * month keeps a `null` change instead of a zero it did not earn.
 *
 * @param series - Observed months, ascending.
 * @returns The rows in descending order, so the last close is read first.
 */
export function buildMonthRows(
  series: readonly PulseSeriesPoint[],
): PulseMonthRow[] {
  return series
    .map((point, index) => {
      const previous = index > 0 ? series[index - 1].pulse : null;
      return {
        month: point.month,
        pulse: point.pulse,
        change:
          point.pulse === null || previous === null
            ? null
            : point.pulse - previous,
        confidence: point.confidence,
        pillars: point.pillars,
        cashEnd: point.cashEnd,
        unknownCount: countUnknown(point),
      };
    })
    .reverse();
}

/**
 * Builds one row per forecast horizon, nearest month first.
 *
 * @param forecast - Forecast horizons, ascending.
 * @param pulseNow - Score of the last observed month, the base of the change.
 * @returns The rows in ascending horizon order.
 */
export function buildForecastRows(
  forecast: readonly PulseForecastPoint[],
  pulseNow: number | null,
): PulseForecastRow[] {
  return forecast.map((point) => ({
    horizon: point.horizon,
    targetMonth: point.targetMonth,
    pulsePred: point.pulsePred,
    pulseP10: point.pulseP10,
    pulseP90: point.pulseP90,
    change:
      point.pulsePred === null || pulseNow === null
        ? null
        : point.pulsePred - pulseNow,
    delta: point.delta,
  }));
}
