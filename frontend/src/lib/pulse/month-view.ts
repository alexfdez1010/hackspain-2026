import type { PulseVariableRow } from '@/lib/pulse/company-view';
import type { PulseSeriesPoint } from '@/lib/pulse/types';
import { formatMonth } from '@/lib/format';

/** One entry of the month selector: the key and its Spanish label. */
export interface PulseMonthOption {
  id: string;
  label: string;
}

/**
 * Builds the options of the month selector, most recent first.
 *
 * @param series - Observed months, ascending.
 * @returns One option per observed month, latest close first.
 */
export function buildMonthOptions(
  series: readonly PulseSeriesPoint[],
): PulseMonthOption[] {
  return series
    .map((point) => ({ id: point.month, label: formatMonth(point.month) }))
    .reverse();
}

/**
 * Finds the observed month a selector value refers to.
 *
 * @param series - Observed months, ascending.
 * @param month - Month key such as `2026-08`; anything unknown falls back.
 * @returns The month, the last observed one when it is missing, or `null`.
 */
export function findMonth(
  series: readonly PulseSeriesPoint[],
  month: string,
): PulseSeriesPoint | null {
  return (
    series.find((point) => point.month === month) ??
    series[series.length - 1] ??
    null
  );
}

/**
 * Orders variable rows by the points they add to the raw score.
 *
 * Variables with no evidence keep their place at the end: they add nothing,
 * but they are not the smallest contributor, they are an unmeasured one.
 *
 * @param rows - Variable rows of one month.
 * @returns A new array, largest contributor first and unknowns last.
 */
export function sortByContribution(
  rows: readonly PulseVariableRow[],
): PulseVariableRow[] {
  return [...rows].sort((a, b) => {
    if (a.known !== b.known) return a.known ? -1 : 1;
    const left = a.contribution ?? 0;
    const right = b.contribution ?? 0;
    return right - left || b.weight - a.weight;
  });
}

/**
 * Adds up the points the known variables put into the raw score.
 *
 * @param rows - Variable rows of one month.
 * @returns The sum of the contributions, which matches the PULSE of the month.
 */
export function sumVariableContributions(
  rows: readonly PulseVariableRow[],
): number {
  return rows.reduce((total, row) => total + (row.contribution ?? 0), 0);
}
