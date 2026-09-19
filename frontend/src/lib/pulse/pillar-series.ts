import type { PulsePillarMeta, PulseSeriesPoint } from '@/lib/pulse/types';

/** One observed month of a pillar. */
export interface PulsePillarPoint {
  month: string;
  /** Pillar score of the month; `null` when the pillar had no evidence. */
  value: number | null;
}

/** The observed history of one pillar, with its published weight. */
export interface PulsePillarSeries {
  key: string;
  label: string;
  /** Points of the 100 owned by the pillar. */
  weight: number;
  points: PulsePillarPoint[];
  /** Score of the last observed month, or `null` when it is unknown. */
  last: number | null;
  /** Change between the first and the last observed month. */
  change: number | null;
}

/**
 * Builds one small-multiple series per pillar, heaviest pillar first.
 *
 * Every pillar keeps a point for every observed month, `null` included, so the
 * four charts share one horizontal scale and can be compared month by month.
 *
 * @param pillars - Pillar metadata from the summary.
 * @param series - Observed months, ascending.
 * @returns One series per pillar, ordered by weight.
 */
export function buildPillarSeries(
  pillars: readonly PulsePillarMeta[],
  series: readonly PulseSeriesPoint[],
): PulsePillarSeries[] {
  return [...pillars]
    .sort((a, b) => b.weight - a.weight || a.key.localeCompare(b.key))
    .map((pillar) => {
      const points = series.map((point) => ({
        month: point.month,
        value: point.pillars[pillar.key] ?? null,
      }));
      const known = points.filter(
        (point): point is { month: string; value: number } =>
          point.value !== null,
      );
      const first = known[0]?.value ?? null;
      const last = known[known.length - 1]?.value ?? null;
      return {
        key: pillar.key,
        label: pillar.label,
        weight: pillar.weight,
        points,
        last,
        change: first === null || last === null ? null : last - first,
      };
    });
}
