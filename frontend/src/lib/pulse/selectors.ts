import type { PulseCompanyRow } from '@/lib/pulse/types';

/** Column the portfolio table can be ordered by. */
export type PulseSortKey = 'pulse' | 'change' | 'forecastDelta' | 'id';

/** Ordering applied to the portfolio table. */
export interface PulseSort {
  key: PulseSortKey;
  direction: 'asc' | 'desc';
}

/** Default ordering: the weakest companies first. */
export const DEFAULT_PULSE_SORT: PulseSort = { key: 'pulse', direction: 'asc' };

/**
 * Change of the score against the previous month.
 *
 * @param row - Portfolio row.
 * @returns The change in points, or `null` when either month is unknown.
 */
export function monthlyChange(row: PulseCompanyRow): number | null {
  if (row.pulse === null || row.pulsePrev === null) return null;
  return row.pulse - row.pulsePrev;
}

/**
 * Change the six-month forecast implies against today's score.
 *
 * @param row - Portfolio row.
 * @returns The change in points, or `null` when there is no forecast.
 */
export function forecastDelta(row: PulseCompanyRow): number | null {
  const predicted = row.forecast6m?.pulsePred ?? null;
  if (row.pulse === null || predicted === null) return null;
  return predicted - row.pulse;
}

/**
 * Reads the sortable magnitude of a row.
 *
 * @param row - Portfolio row.
 * @param key - Column being sorted.
 * @returns The magnitude, or `null` when the row cannot be compared.
 */
function sortValue(row: PulseCompanyRow, key: PulseSortKey): number | null {
  if (key === 'pulse') return row.pulse;
  if (key === 'change') return monthlyChange(row);
  if (key === 'forecastDelta') return forecastDelta(row);
  return null;
}

/**
 * Orders the portfolio without mutating the input.
 *
 * Rows with no comparable value are always pushed to the end, in both
 * directions, so an unknown never looks like the worst or the best company.
 *
 * @param rows - Portfolio rows.
 * @param sort - Column and direction.
 * @returns A new, ordered array.
 */
export function sortPulseRows(
  rows: readonly PulseCompanyRow[],
  sort: PulseSort,
): PulseCompanyRow[] {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === 'id') {
      return factor * a.companyId.localeCompare(b.companyId);
    }
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);
    if (left === null && right === null) {
      return a.companyId.localeCompare(b.companyId);
    }
    if (left === null) return 1;
    if (right === null) return -1;
    if (left === right) return a.companyId.localeCompare(b.companyId);
    return factor * (left - right);
  });
}

/** Headline figures of the portfolio. */
export interface PulsePortfolioStats {
  /** Number of companies in the export. */
  count: number;
  /** Median score, the level half the portfolio sits below. */
  median: number | null;
  /** Companies whose score is below 50. */
  belowWatch: number;
  /** Companies the six-month forecast puts below today's score. */
  deteriorating: number;
}

/**
 * Summarises the portfolio for the page header.
 *
 * @param rows - Portfolio rows.
 * @returns Count, median score and the two risk counters.
 */
export function pulsePortfolioStats(
  rows: readonly PulseCompanyRow[],
): PulsePortfolioStats {
  const scores = rows
    .map((row) => row.pulse)
    .filter((score): score is number => score !== null)
    .sort((a, b) => a - b);
  const middle = Math.floor(scores.length / 2);
  const median =
    scores.length === 0
      ? null
      : scores.length % 2 === 1
        ? scores[middle]
        : (scores[middle - 1] + scores[middle]) / 2;
  return {
    count: rows.length,
    median,
    belowWatch: scores.filter((score) => score < 50).length,
    deteriorating: rows.filter((row) => (forecastDelta(row) ?? 0) < 0).length,
  };
}
