import { describe, expect, it } from 'vitest';

import {
  portfolioStats,
  scoreHistogram,
  toRadarRow,
  topMovers,
  worstByScore,
  type RadarRow,
} from '@/lib/xray/selectors';
import { makeCompany } from './fixtures';

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

describe('toRadarRow', () => {
  it('derives both deltas and the score band', () => {
    const projected = toRadarRow(
      makeCompany({ score: 70, score_prev: 65, score_6m_ago: 40 }),
    );
    expect(projected.delta1m).toBe(5);
    expect(projected.delta6m).toBe(30);
    expect(projected.band).toBe('solid');
  });

  it('keeps the deltas absent when there is no history', () => {
    const projected = toRadarRow(
      makeCompany({ score_prev: null, score_6m_ago: null }),
    );
    expect(projected.delta1m).toBeNull();
    expect(projected.delta6m).toBeNull();
  });
});

describe('scoreHistogram', () => {
  it('covers the 0-100 range with fixed-width buckets', () => {
    const bins = scoreHistogram([], 5);
    expect(bins).toHaveLength(20);
    expect(bins[0]).toMatchObject({ from: 0, to: 5, count: 0 });
    expect(bins[19]).toMatchObject({ from: 95, to: 100 });
  });

  it('counts each score in its bucket', () => {
    const bins = scoreHistogram([0, 4.9, 5, 99.9, 100], 5);
    expect(bins[0].count).toBe(2);
    expect(bins[1].count).toBe(1);
    expect(bins[19].count).toBe(2);
  });

  it('ignores non-finite scores and guards the bin width', () => {
    const bins = scoreHistogram([Number.NaN, 50], 0);
    expect(bins.reduce((total, bin) => total + bin.count, 0)).toBe(1);
  });
});

describe('topMovers', () => {
  const rows = [
    row({ id: 'A', delta6m: 30 }),
    row({ id: 'B', delta6m: -40 }),
    row({ id: 'C', delta6m: 10 }),
    row({ id: 'D', delta6m: null }),
  ];

  it('ranks improvements descending and deteriorations ascending', () => {
    const movers = topMovers(rows, 2);
    expect(movers.improvers.map((item) => item.id)).toEqual(['A', 'C']);
    expect(movers.decliners.map((item) => item.id)).toEqual(['B', 'C']);
  });

  it('drops rows without six months of history', () => {
    const movers = topMovers(rows, 10);
    expect(movers.improvers.some((item) => item.id === 'D')).toBe(false);
    expect(movers.decliners.some((item) => item.id === 'D')).toBe(false);
  });
});

describe('portfolioStats', () => {
  it('computes the median with an even number of rows', () => {
    const stats = portfolioStats([
      row({ score: 10 }),
      row({ score: 20 }),
      row({ score: 30 }),
      row({ score: 40 }),
    ]);
    expect(stats.medianScore).toBe(25);
    expect(stats.total).toBe(4);
  });

  it('computes the median with an odd number of rows', () => {
    const stats = portfolioStats([
      row({ score: 10 }),
      row({ score: 90 }),
      row({ score: 50 }),
    ]);
    expect(stats.medianScore).toBe(50);
  });

  it('counts the risk buckets', () => {
    const stats = portfolioStats([
      row({
        direction: 'deteriorating',
        regime: 'structural_decline',
        pStress: 0.4,
      }),
      row({ direction: 'improving', pStress: 0.34 }),
    ]);
    expect(stats).toMatchObject({
      deteriorating: 1,
      structuralDecline: 1,
      highStress: 1,
    });
  });

  it('returns a zero median for an empty portfolio', () => {
    expect(portfolioStats([]).medianScore).toBe(0);
  });
});

describe('worstByScore', () => {
  it('returns the lowest scores ascending without mutating the input', () => {
    const companies = [
      makeCompany({ company_id: 'A', score: 80 }),
      makeCompany({ company_id: 'B', score: 10 }),
      makeCompany({ company_id: 'C', score: 40 }),
    ];
    const worst = worstByScore(companies, 2);
    expect(worst.map((company) => company.company_id)).toEqual(['B', 'C']);
    expect(companies[0].company_id).toBe('A');
  });
});
