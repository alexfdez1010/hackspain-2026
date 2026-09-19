import type { RadarRow } from '@/lib/xray/selectors';
import type { ScoreBandKey } from '@/lib/xray/score';
import type { Direction, Regime } from '@/lib/xray/types';

/** Active filters of the portfolio table. `all` disables the filter. */
export interface RadarFilters {
  search: string;
  direction: Direction | 'all';
  regime: Regime | 'all';
  band: ScoreBandKey | 'all';
}

/** Columns the portfolio table can be ordered by. */
export type RadarSortKey =
  'score' | 'delta1m' | 'delta6m' | 'trend6m' | 'pStress' | 'id';

/** Ordering applied to the portfolio table. */
export interface RadarSort {
  key: RadarSortKey;
  direction: 'asc' | 'desc';
}

/** Filters that let every company through. */
export const EMPTY_FILTERS: RadarFilters = {
  search: '',
  direction: 'all',
  regime: 'all',
  band: 'all',
};

/**
 * Applies the search box and the three facet filters.
 *
 * The search matches the company and the group identifier, case-insensitively,
 * so a jury member can type either `comp_0001` or `GROUP_0147`.
 *
 * @param rows - Portfolio rows.
 * @param filters - Active filters.
 * @returns The rows that match every active filter, in the input order.
 */
export function filterRows(
  rows: readonly RadarRow[],
  filters: RadarFilters,
): RadarRow[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.direction !== 'all' && row.direction !== filters.direction) {
      return false;
    }
    if (filters.regime !== 'all' && row.regime !== filters.regime) return false;
    if (filters.band !== 'all' && row.band !== filters.band) return false;
    if (query === '') return true;
    return (
      row.id.toLowerCase().includes(query) ||
      row.group.toLowerCase().includes(query)
    );
  });
}

/**
 * Reads the sortable value of a row, treating missing deltas as absent.
 *
 * @param row - Portfolio row.
 * @param key - Column to read.
 * @returns A number, or `null` when the column has no value for that row.
 */
function sortValue(row: RadarRow, key: RadarSortKey): number | null {
  switch (key) {
    case 'score':
      return row.score;
    case 'delta1m':
      return row.delta1m;
    case 'delta6m':
      return row.delta6m;
    case 'trend6m':
      return row.trend6m;
    case 'pStress':
      return row.pStress;
    case 'id':
      return null;
  }
}

/**
 * Orders the portfolio table. Rows without a value always sink to the bottom,
 * whatever the direction, so the ranking never starts with unknowns.
 *
 * @param rows - Portfolio rows.
 * @param sort - Column and direction.
 * @returns A new ordered array; the input is not mutated.
 */
export function sortRows(
  rows: readonly RadarRow[],
  sort: RadarSort,
): RadarRow[] {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === 'id') return a.id.localeCompare(b.id) * factor;
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);
    if (left === null && right === null) return a.id.localeCompare(b.id);
    if (left === null) return 1;
    if (right === null) return -1;
    if (left === right) return a.id.localeCompare(b.id);
    return (left - right) * factor;
  });
}

/**
 * Filters and orders the portfolio in one pass, as the table needs it.
 *
 * @param rows - Portfolio rows.
 * @param filters - Active filters.
 * @param sort - Column and direction.
 * @returns The visible rows, already ordered.
 */
export function selectRadarRows(
  rows: readonly RadarRow[],
  filters: RadarFilters,
  sort: RadarSort,
): RadarRow[] {
  return sortRows(filterRows(rows, filters), sort);
}
