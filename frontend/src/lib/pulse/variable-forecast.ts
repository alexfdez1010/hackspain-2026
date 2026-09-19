import type { PulseForecastPoint } from '@/lib/pulse/types';

/** What one variable does to the forecast at one horizon. */
export interface PulseVariableForecastImpact {
  horizon: number;
  targetMonth: string;
  /** Points of PULSE the variable adds to the predicted change. */
  points: number | null;
  /** Predicted change of PULSE at the horizon, every driver included. */
  delta: number | null;
  /** Predicted PULSE at the horizon. */
  pulsePred: number | null;
}

/** The forecast read from the side of one variable. */
export interface PulseVariableForecast {
  /** One entry per horizon, ascending. */
  impacts: PulseVariableForecastImpact[];
  /** Horizon where the variable weighs the most, in absolute points. */
  peak: PulseVariableForecastImpact | null;
  /** Impact at the farthest horizon. */
  farthest: PulseVariableForecastImpact | null;
  /** Rank of the variable among every driver at the farthest horizon, 1 first. */
  rankAtFarthest: number | null;
  /** Number of drivers the model decomposes the farthest horizon into. */
  driverCount: number;
}

/**
 * Reads what one variable contributes to every forecast horizon.
 *
 * The contribution is the number of points of the predicted change that the
 * model attributes to the variable; the sum of every driver, `contexto` and
 * `base` included, is the predicted change itself.
 *
 * @param forecast - Forecast horizons, ascending.
 * @param variableKey - Variable key of the export.
 * @returns The impacts, the horizon where the variable weighs most and its
 * rank among the drivers at the farthest horizon.
 */
export function buildVariableForecast(
  forecast: readonly PulseForecastPoint[],
  variableKey: string,
): PulseVariableForecast {
  const impacts = forecast.map((point) => ({
    horizon: point.horizon,
    targetMonth: point.targetMonth,
    points: point.contributions[variableKey] ?? null,
    delta: point.delta,
    pulsePred: point.pulsePred,
  }));
  const peak = impacts.reduce<PulseVariableForecastImpact | null>(
    (top, item) =>
      item.points !== null &&
      (top === null ||
        top.points === null ||
        Math.abs(item.points) > Math.abs(top.points))
        ? item
        : top,
    null,
  );
  const last = forecast[forecast.length - 1];
  const farthest = impacts[impacts.length - 1] ?? null;
  const drivers = last
    ? Object.entries(last.contributions).sort(
        (a, b) => Math.abs(b[1]) - Math.abs(a[1]),
      )
    : [];
  const position = drivers.findIndex(([key]) => key === variableKey);
  return {
    impacts,
    peak,
    farthest,
    rankAtFarthest: position === -1 ? null : position + 1,
    driverCount: drivers.length,
  };
}
