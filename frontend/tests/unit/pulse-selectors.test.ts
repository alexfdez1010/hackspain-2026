import { describe, expect, it } from 'vitest';

import {
  forecastDelta,
  monthlyChange,
  pulsePortfolioStats,
  sortPulseRows,
} from '@/lib/pulse/selectors';
import { makeRow } from './pulse-fixtures';

describe('derived magnitudes', () => {
  it('measures the monthly change against the previous score', () => {
    expect(
      monthlyChange(makeRow({ pulse: 32.77, pulsePrev: 17.88 })),
    ).toBeCloseTo(14.89, 2);
    expect(monthlyChange(makeRow({ pulsePrev: null }))).toBeNull();
  });

  it('measures the forecast against today, not against the previous month', () => {
    expect(
      forecastDelta(
        makeRow({
          pulse: 32.77,
          forecast6m: { pulsePred: 31.07, pulseP10: 15, pulseP90: 48 },
        }),
      ),
    ).toBeCloseTo(-1.7, 2);
    expect(forecastDelta(makeRow({ forecast6m: null }))).toBeNull();
  });
});

describe('sortPulseRows', () => {
  const rows = [
    makeRow({ companyId: 'A', pulse: 60, pulsePrev: 50 }),
    makeRow({ companyId: 'B', pulse: 20, pulsePrev: 40 }),
    makeRow({ companyId: 'C', pulse: 40, pulsePrev: 40 }),
  ];

  it('orders by score in both directions without mutating the input', () => {
    const ordered = sortPulseRows(rows, { key: 'pulse', direction: 'asc' });
    expect(ordered.map((row) => row.companyId)).toEqual(['B', 'C', 'A']);
    expect(
      sortPulseRows(rows, { key: 'pulse', direction: 'desc' }).map(
        (row) => row.companyId,
      ),
    ).toEqual(['A', 'C', 'B']);
    expect(rows.map((row) => row.companyId)).toEqual(['A', 'B', 'C']);
  });

  it('orders by monthly change and by forecast change', () => {
    expect(
      sortPulseRows(rows, { key: 'change', direction: 'asc' }).map(
        (row) => row.companyId,
      ),
    ).toEqual(['B', 'C', 'A']);
    const withForecasts = [
      makeRow({
        companyId: 'A',
        pulse: 50,
        forecast6m: { pulsePred: 40, pulseP10: 30, pulseP90: 50 },
      }),
      makeRow({
        companyId: 'B',
        pulse: 50,
        forecast6m: { pulsePred: 60, pulseP10: 50, pulseP90: 70 },
      }),
    ];
    expect(
      sortPulseRows(withForecasts, {
        key: 'forecastDelta',
        direction: 'asc',
      }).map((row) => row.companyId),
    ).toEqual(['A', 'B']);
  });

  it('keeps rows without a value at the end in both directions', () => {
    const withUnknown = [
      makeRow({ companyId: 'A', pulse: 60 }),
      makeRow({ companyId: 'B', pulse: null }),
      makeRow({ companyId: 'C', pulse: 20 }),
    ];
    expect(
      sortPulseRows(withUnknown, { key: 'pulse', direction: 'asc' }).map(
        (row) => row.companyId,
      ),
    ).toEqual(['C', 'A', 'B']);
    expect(
      sortPulseRows(withUnknown, { key: 'pulse', direction: 'desc' }).map(
        (row) => row.companyId,
      ),
    ).toEqual(['A', 'C', 'B']);
  });

  it('breaks ties by identifier so the order is stable', () => {
    const tied = [
      makeRow({ companyId: 'Z', pulse: 30 }),
      makeRow({ companyId: 'A', pulse: 30 }),
    ];
    expect(
      sortPulseRows(tied, { key: 'pulse', direction: 'desc' }).map(
        (row) => row.companyId,
      ),
    ).toEqual(['A', 'Z']);
    expect(
      sortPulseRows(tied, { key: 'id', direction: 'asc' }).map(
        (row) => row.companyId,
      ),
    ).toEqual(['A', 'Z']);
  });
});

describe('pulsePortfolioStats', () => {
  it('summarises level and direction of the portfolio', () => {
    const stats = pulsePortfolioStats([
      makeRow({
        companyId: 'A',
        pulse: 20,
        forecast6m: { pulsePred: 10, pulseP10: 5, pulseP90: 20 },
      }),
      makeRow({
        companyId: 'B',
        pulse: 60,
        forecast6m: { pulsePred: 70, pulseP10: 60, pulseP90: 80 },
      }),
      makeRow({
        companyId: 'C',
        pulse: 40,
        forecast6m: { pulsePred: 30, pulseP10: 20, pulseP90: 45 },
      }),
    ]);
    expect(stats).toEqual({
      count: 3,
      median: 40,
      belowWatch: 2,
      deteriorating: 2,
    });
  });

  it('averages the two middle scores on an even portfolio', () => {
    const stats = pulsePortfolioStats([
      makeRow({ companyId: 'A', pulse: 20 }),
      makeRow({ companyId: 'B', pulse: 30 }),
    ]);
    expect(stats.median).toBe(25);
  });

  it('reports no median when no company is scored', () => {
    expect(pulsePortfolioStats([]).median).toBeNull();
    expect(pulsePortfolioStats([makeRow({ pulse: null })]).median).toBeNull();
  });
});
