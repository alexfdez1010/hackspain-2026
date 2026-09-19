import type { PulseSeriesPoint } from '@/lib/pulse/types';

/** One observed month as the page of a variable reads it. */
export interface PulseVariablePoint {
  month: string;
  /** Score of the variable this month; `null` without evidence. */
  score: number | null;
  /** Raw figure behind the score, in the unit of the variable. */
  raw: number | null;
  /** Points the variable added to the PULSE of the month. */
  contribution: number | null;
  /** `false` when the month carries no data for the variable. */
  known: boolean;
  /** Score of the pillar the variable feeds, the same month. */
  pillarScore: number | null;
  /** PULSE of the month, so the variable can be read against the whole. */
  pulse: number | null;
  /** Score change against the previous month with evidence. */
  change: number | null;
}

/** A month with a score, for the extremes and the trend. */
export interface PulseVariableExtreme {
  month: string;
  score: number;
}

/** Figures computed over the observed history of one variable. */
export interface PulseVariableStats {
  /** Months with evidence for the variable. */
  known: number;
  /** Months observed for the company. */
  total: number;
  /** Mean score over the months with evidence. */
  mean: number | null;
  /** Month with the highest score. */
  best: PulseVariableExtreme | null;
  /** Month with the lowest score. */
  worst: PulseVariableExtreme | null;
  /** Score change between the first and the last month with evidence. */
  trend: number | null;
  /** Largest month-to-month move, signed. */
  largestMove: PulseVariableExtreme | null;
  /** Mean of the raw figure over the months with evidence. */
  rawMean: number | null;
  /** Points the variable contributed on average per month with evidence. */
  meanContribution: number | null;
}

/**
 * Reads one variable out of every observed month of a company.
 *
 * A month without evidence keeps `known: false` and `null` figures, so a chart
 * can leave a gap instead of drawing a zero. The change is measured against
 * the previous month that had evidence, whatever the gap between them.
 *
 * @param series - Observed months, ascending.
 * @param variableKey - Variable key of the export.
 * @param pillarKey - Key of the pillar the variable feeds.
 * @returns One point per observed month, ascending.
 */
export function buildVariablePoints(
  series: readonly PulseSeriesPoint[],
  variableKey: string,
  pillarKey: string,
): PulseVariablePoint[] {
  let previous: number | null = null;
  return series.map((point) => {
    const value = point.variables[variableKey];
    const known = value?.known === true && value.score !== null;
    const score = known ? value.score : null;
    const change =
      score !== null && previous !== null ? score - previous : null;
    if (score !== null) previous = score;
    return {
      month: point.month,
      score,
      raw: known ? value.raw : null,
      contribution: known ? (point.contributions[variableKey] ?? null) : null,
      known,
      pillarScore: point.pillars[pillarKey] ?? null,
      pulse: point.pulse,
      change,
    };
  });
}

/**
 * Averages a list of figures.
 *
 * @param values - Figures to average.
 * @returns The mean, or `null` when the list is empty.
 */
function mean(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Summarises the observed history of one variable.
 *
 * @param points - One point per observed month, ascending.
 * @returns The stats over the months with evidence.
 */
export function buildVariableStats(
  points: readonly PulseVariablePoint[],
): PulseVariableStats {
  const known = points.filter(
    (point): point is PulseVariablePoint & { score: number } =>
      point.score !== null,
  );
  const scored = known.map((point) => ({
    month: point.month,
    score: point.score,
  }));
  const best = scored.reduce<PulseVariableExtreme | null>(
    (top, item) => (top === null || item.score > top.score ? item : top),
    null,
  );
  const worst = scored.reduce<PulseVariableExtreme | null>(
    (low, item) => (low === null || item.score < low.score ? item : low),
    null,
  );
  const moves = known
    .filter(
      (
        point,
      ): point is PulseVariablePoint & { score: number; change: number } =>
        point.change !== null,
    )
    .map((point) => ({ month: point.month, score: point.change }));
  const largestMove = moves.reduce<PulseVariableExtreme | null>(
    (top, item) =>
      top === null || Math.abs(item.score) > Math.abs(top.score) ? item : top,
    null,
  );
  const first = known[0]?.score ?? null;
  const last = known[known.length - 1]?.score ?? null;
  return {
    known: known.length,
    total: points.length,
    mean: mean(known.map((point) => point.score)),
    best,
    worst,
    trend: first === null || last === null ? null : last - first,
    largestMove,
    rawMean: mean(
      known
        .map((point) => point.raw)
        .filter((raw): raw is number => raw !== null),
    ),
    meanContribution: mean(
      known
        .map((point) => point.contribution)
        .filter((value): value is number => value !== null),
    ),
  };
}
