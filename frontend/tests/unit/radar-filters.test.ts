import { describe, expect, it } from 'vitest';

import {
  EMPTY_FILTERS,
  filterRows,
  selectRadarRows,
  sortRows,
} from '@/lib/xray/radar-filters';
import type { RadarRow } from '@/lib/xray/selectors';

/**
 * Builds a portfolio row with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns A complete radar row.
 */
function row(overrides: Partial<RadarRow> = {}): RadarRow {
  return {
    id: 'COMP_0001',
    group: 'GROUP_0001',
    score: 60,
    delta1m: 1,
    delta6m: 5,
    trend6m: 1,
    direction: 'improving',
    regime: 'steady',
    pStress: 0.1,
    months: 24,
    band: 'neutral',
    ...overrides,
  };
}

const ROWS: RadarRow[] = [
  row({
    id: 'COMP_0001',
    group: 'GROUP_0100',
    score: 20,
    band: 'critical',
    direction: 'deteriorating',
    regime: 'structural_decline',
    delta6m: -30,
    pStress: 0.8,
  }),
  row({
    id: 'COMP_0002',
    group: 'GROUP_0200',
    score: 55,
    band: 'neutral',
    direction: 'stable',
    regime: 'steady',
    delta6m: 0,
    pStress: 0.2,
  }),
  row({
    id: 'COMP_0003',
    group: 'GROUP_0100',
    score: 85,
    band: 'solid',
    direction: 'improving',
    regime: 'structural_improvement',
    delta6m: 20,
    pStress: 0.05,
  }),
  row({
    id: 'COMP_0004',
    group: 'GROUP_0300',
    score: 45,
    band: 'fragile',
    direction: 'improving',
    regime: 'steady',
    delta6m: null,
    pStress: 0.5,
  }),
];

describe('filterRows', () => {
  it('lets everything through with the empty filters', () => {
    expect(filterRows(ROWS, EMPTY_FILTERS)).toHaveLength(4);
  });

  it('filters by direction, regime and band', () => {
    expect(
      filterRows(ROWS, { ...EMPTY_FILTERS, direction: 'improving' }),
    ).toHaveLength(2);
    expect(
      filterRows(ROWS, { ...EMPTY_FILTERS, regime: 'structural_decline' }),
    ).toHaveLength(1);
    expect(filterRows(ROWS, { ...EMPTY_FILTERS, band: 'solid' })).toHaveLength(
      1,
    );
  });

  it('combines filters with AND', () => {
    expect(
      filterRows(ROWS, {
        ...EMPTY_FILTERS,
        direction: 'improving',
        band: 'solid',
      }),
    ).toHaveLength(1);
  });

  it('searches company and group, ignoring case and padding', () => {
    expect(
      filterRows(ROWS, { ...EMPTY_FILTERS, search: ' comp_0003 ' }),
    ).toHaveLength(1);
    expect(
      filterRows(ROWS, { ...EMPTY_FILTERS, search: 'group_0100' }),
    ).toHaveLength(2);
    expect(filterRows(ROWS, { ...EMPTY_FILTERS, search: 'zzz' })).toHaveLength(
      0,
    );
  });
});

describe('sortRows', () => {
  it('orders ascending and descending', () => {
    expect(
      sortRows(ROWS, { key: 'score', direction: 'asc' }).map((item) => item.id),
    ).toEqual(['COMP_0001', 'COMP_0004', 'COMP_0002', 'COMP_0003']);
    expect(sortRows(ROWS, { key: 'score', direction: 'desc' })[0].id).toBe(
      'COMP_0003',
    );
  });

  it('sinks rows without a value whatever the direction', () => {
    for (const direction of ['asc', 'desc'] as const) {
      const sorted = sortRows(ROWS, { key: 'delta6m', direction });
      expect(sorted[sorted.length - 1].id).toBe('COMP_0004');
    }
  });

  it('orders identifiers alphabetically', () => {
    expect(sortRows(ROWS, { key: 'id', direction: 'asc' })[0].id).toBe(
      'COMP_0001',
    );
  });

  it('does not mutate the input', () => {
    const input = [...ROWS];
    sortRows(input, { key: 'score', direction: 'desc' });
    expect(input.map((item) => item.id)).toEqual(ROWS.map((item) => item.id));
  });
});

describe('selectRadarRows', () => {
  it('filters before ordering', () => {
    const selected = selectRadarRows(
      ROWS,
      { ...EMPTY_FILTERS, direction: 'improving' },
      { key: 'score', direction: 'desc' },
    );
    expect(selected.map((item) => item.id)).toEqual(['COMP_0003', 'COMP_0004']);
  });
});
