import type {
  PulseForecastPoint,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';

/** One point of the trajectory chart, observed or predicted. */
export interface PulseTrajectoryPoint {
  month: string;
  /** Observed score, or the predicted one for a forecast point. */
  value: number | null;
  /** Lower bound of the 80 % band; `null` where there is no uncertainty. */
  p10: number | null;
  /** Upper bound of the 80 % band. */
  p90: number | null;
  kind: 'observed' | 'forecast';
}

/** The trajectory and where the observed history ends. */
export interface PulseTrajectory {
  points: PulseTrajectoryPoint[];
  /** Index of the last observed month, or `-1` when there is no history. */
  boundaryIndex: number;
}

/**
 * Merges the observed history and the forecast into one ordered series.
 *
 * The last observed month is given a zero-width band, so the shaded interval
 * starts exactly at the known score instead of appearing out of nowhere one
 * month later.
 *
 * @param series - Observed months, ascending.
 * @param forecast - Forecast horizons, ascending.
 * @returns The merged points and the index of the boundary.
 */
export function buildTrajectory(
  series: readonly PulseSeriesPoint[],
  forecast: readonly PulseForecastPoint[],
): PulseTrajectory {
  const boundaryIndex = series.length - 1;
  const observed: PulseTrajectoryPoint[] = series.map((point, index) => ({
    month: point.month,
    value: point.pulse,
    p10: index === boundaryIndex ? point.pulse : null,
    p90: index === boundaryIndex ? point.pulse : null,
    kind: 'observed',
  }));
  const predicted: PulseTrajectoryPoint[] = forecast.map((point) => ({
    month: point.targetMonth,
    value: point.pulsePred,
    p10: point.pulseP10,
    p90: point.pulseP90,
    kind: 'forecast',
  }));
  return { points: [...observed, ...predicted], boundaryIndex };
}

/** One row of the variable table of a month. */
export interface PulseVariableRow extends PulseVariableMeta {
  /** Spanish label of the pillar the variable feeds. */
  pillarLabel: string;
  score: number | null;
  rawValue: number | null;
  /** Points the variable adds to the raw score this month. */
  contribution: number | null;
  known: boolean;
}

/**
 * Builds the variable table of one month, ordered by weight.
 *
 * A variable with no evidence keeps `known: false` and `null` figures, so the
 * view can say «sin datos» instead of rendering a zero the reader would take
 * for a measured value.
 *
 * @param variables - Variable metadata from the summary.
 * @param point - Month to read; `null` renders every variable as unknown.
 * @param pillarLabels - Pillar key to Spanish label.
 * @returns The rows, heaviest variable first.
 */
export function buildVariableRows(
  variables: readonly PulseVariableMeta[],
  point: PulseSeriesPoint | null,
  pillarLabels: Record<string, string>,
): PulseVariableRow[] {
  return variables
    .map((variable) => {
      const value = point?.variables[variable.key];
      const known = value?.known === true;
      return {
        ...variable,
        pillarLabel: pillarLabels[variable.pillar] ?? variable.pillar,
        score: known ? (value?.score ?? null) : null,
        rawValue: known ? (value?.raw ?? null) : null,
        contribution: known
          ? (point?.contributions[variable.key] ?? null)
          : null,
        known,
      };
    })
    .sort((a, b) => b.weight - a.weight || a.number - b.number);
}

/** Spanish labels of the two contributions that are not a variable. */
export const EXTRA_CONTRIBUTION_LABELS: Record<string, string> = {
  contexto: 'Contexto: flujos, calendario y grupo',
  base: 'Base del modelo',
};

/** One bar of the forecast decomposition. */
export interface PulseContributionItem {
  key: string;
  label: string;
  /** Points of `pulse_raw` the driver adds at this horizon. */
  value: number;
}

/**
 * Builds the decomposition of one forecast horizon, largest driver first.
 *
 * Every key published by the model is kept, including `contexto` and `base`,
 * because only the complete set sums to the predicted change.
 *
 * @param point - Forecast horizon to decompose.
 * @param variables - Variable metadata, used for the labels.
 * @returns The bars ordered by absolute impact.
 */
export function buildContributionItems(
  point: PulseForecastPoint,
  variables: readonly PulseVariableMeta[],
): PulseContributionItem[] {
  const labels = new Map(variables.map((item) => [item.key, item.label]));
  return Object.entries(point.contributions)
    .map(([key, value]) => ({
      key,
      label: labels.get(key) ?? EXTRA_CONTRIBUTION_LABELS[key] ?? key,
      value,
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

/**
 * Adds up a decomposition, which must match the predicted change.
 *
 * @param point - Forecast horizon.
 * @returns The sum of every contribution, in points of the raw score.
 */
export function sumContributions(point: PulseForecastPoint): number {
  return Object.values(point.contributions).reduce(
    (total, value) => total + value,
    0,
  );
}
