import { describe, expect, it } from 'vitest';

import {
  MAX_LIMIT,
  averageMonthlyInflow,
  computeOffer,
  offerStatus,
  offerTimeline,
  regimeAdjustedMultiplier,
  scoreMultiplier,
  spreadBps,
  type OfferInput,
} from '@/lib/xray/offer';
import type { MonthRecord, Regime } from '@/lib/xray/types';

/**
 * Builds a month record with only the fields the pricing rules read.
 *
 * @param month - Month key.
 * @param overrides - Score, stress, regime and inflow to apply.
 * @returns A month record usable by the offer helpers.
 */
function month(
  month: string,
  overrides: { score?: number; inflow?: number | null; regime?: Regime } = {},
): MonthRecord {
  return {
    month,
    score: overrides.score ?? 70,
    score_raw: null,
    composite: null,
    p_stress: 0.1,
    trend_6m: 0,
    direction: 'stable',
    regime: overrides.regime ?? 'steady',
    regime_shift: null,
    changepoint_month: null,
    pillars: {
      liquidity: null,
      cashflow: null,
      payments: null,
      receivables: null,
      debt: null,
      activity: null,
    },
    raw: {
      inflow: overrides.inflow === undefined ? 10_000 : overrides.inflow,
      outflow: null,
      net: null,
      cash_end: null,
      cash_min: null,
      dso_days: null,
      supplier_delay_days: null,
      overdue_ar: null,
      overdue_ap: null,
      loc_utilization: null,
      returned_debit_n: null,
      stress_n: null,
      n_tx: null,
      n_counterparties: null,
      debt_outstanding: null,
      payroll: null,
      tax_paid: null,
    },
    reasons: [],
    stress_now: 0,
  };
}

/**
 * Builds a pricing input with sensible defaults.
 *
 * @param overrides - Fields to override.
 * @returns A complete offer input.
 */
function input(overrides: Partial<OfferInput> = {}): OfferInput {
  return {
    score: 70,
    p_stress: 0.1,
    regime: 'steady',
    avgMonthlyInflow: 100_000,
    ...overrides,
  };
}

describe('scoreMultiplier', () => {
  it.each([
    [0, 0],
    [34.999, 0],
    [35, 0.25],
    [49.999, 0.25],
    [50, 0.5],
    [64.999, 0.5],
    [65, 0.8],
    [79.999, 0.8],
    [80, 1],
    [100, 1],
  ])('maps score %s to %s', (score, expected) => {
    expect(scoreMultiplier(score)).toBe(expected);
  });

  it('treats a non-finite score as no credit', () => {
    expect(scoreMultiplier(Number.NaN)).toBe(0);
  });
});

describe('regimeAdjustedMultiplier', () => {
  it('halves the multiplier on a structural decline', () => {
    expect(regimeAdjustedMultiplier(0.8, 'structural_decline')).toBeCloseTo(
      0.4,
    );
  });

  it('widens it by 15 % on a structural improvement', () => {
    expect(regimeAdjustedMultiplier(0.5, 'structural_improvement')).toBeCloseTo(
      0.575,
    );
  });

  it('never exceeds one month of inflow', () => {
    expect(regimeAdjustedMultiplier(1, 'structural_improvement')).toBe(1);
  });

  it('leaves the other regimes untouched', () => {
    for (const regime of [
      'steady',
      'transient_dip',
      'transient_spike',
    ] as const) {
      expect(regimeAdjustedMultiplier(0.5, regime)).toBe(0.5);
    }
  });
});

describe('spreadBps', () => {
  it('prices the floor at zero stress', () => {
    expect(spreadBps(0)).toBe(250);
  });

  it('prices the ceiling at certain stress', () => {
    expect(spreadBps(1)).toBe(1450);
  });

  it('rounds the linear term', () => {
    expect(spreadBps(0.3334)).toBe(250 + 400);
  });

  it('clamps out-of-range probabilities', () => {
    expect(spreadBps(-1)).toBe(250);
    expect(spreadBps(4)).toBe(1450);
    expect(spreadBps(Number.NaN)).toBe(1450);
  });
});

describe('offerStatus', () => {
  it('pre-approves a solid score with low stress', () => {
    expect(offerStatus(50, 0.34)).toBe('preaprobada');
  });

  it('watches the 35-50 score band', () => {
    expect(offerStatus(40, 0.1)).toBe('en vigilancia');
  });

  it('watches a good score with mid stress', () => {
    expect(offerStatus(90, 0.5)).toBe('en vigilancia');
    expect(offerStatus(90, 0.6)).toBe('en vigilancia');
  });

  it('closes everything else', () => {
    expect(offerStatus(20, 0.1)).toBe('cerrada');
    expect(offerStatus(90, 0.61)).toBe('cerrada');
  });
});

describe('computeOffer', () => {
  it('sizes the limit from the score band and the inflow', () => {
    const offer = computeOffer(input({ score: 70, avgMonthlyInflow: 100_000 }));
    expect(offer.limit).toBe(80_000);
    expect(offer.status).toBe('preaprobada');
    expect(offer.spread_bps).toBe(370);
  });

  it('halves the limit when the decline is structural', () => {
    const offer = computeOffer(input({ regime: 'structural_decline' }));
    expect(offer.limit).toBe(40_000);
  });

  it('caps the limit at two million euros', () => {
    const offer = computeOffer(
      input({ score: 95, avgMonthlyInflow: 9_000_000 }),
    );
    expect(offer.limit).toBe(MAX_LIMIT);
  });

  it('lends nothing below 35 points', () => {
    const offer = computeOffer(input({ score: 20, p_stress: 0.9 }));
    expect(offer.limit).toBe(0);
    expect(offer.status).toBe('cerrada');
  });

  it('never returns a negative limit', () => {
    const offer = computeOffer(input({ avgMonthlyInflow: -50_000 }));
    expect(offer.limit).toBe(0);
  });

  it('survives a non-finite inflow', () => {
    const offer = computeOffer(input({ avgMonthlyInflow: Number.NaN }));
    expect(offer.limit).toBe(0);
  });
});

describe('averageMonthlyInflow', () => {
  it('averages the last twelve months by default', () => {
    const series = Array.from({ length: 24 }, (_, index) =>
      month(`2025-${String(index + 1).padStart(2, '0')}`, {
        inflow: index < 12 ? 1_000 : 2_000,
      }),
    );
    expect(averageMonthlyInflow(series)).toBe(2_000);
  });

  it('ignores months without inflow', () => {
    expect(
      averageMonthlyInflow([
        month('2026-01', { inflow: null }),
        month('2026-02', { inflow: 500 }),
      ]),
    ).toBe(500);
  });

  it('returns zero when nothing is known', () => {
    expect(averageMonthlyInflow([])).toBe(0);
  });
});

describe('offerTimeline', () => {
  it('returns one point per trailing month', () => {
    const series = Array.from({ length: 18 }, (_, index) =>
      month(`2025-${String(index + 1).padStart(2, '0')}`),
    );
    const timeline = offerTimeline(series);
    expect(timeline).toHaveLength(12);
    expect(timeline[0].month).toBe('2025-07');
    expect(timeline[11].status).toBe('preaprobada');
  });

  it('tightens the limit when the score falls into the closed band', () => {
    const timeline = offerTimeline([
      month('2026-01', { score: 80 }),
      month('2026-02', { score: 20 }),
    ]);
    expect(timeline[0].limit).toBeGreaterThan(0);
    expect(timeline[1].limit).toBe(0);
    expect(timeline[1].status).toBe('cerrada');
  });

  it('handles an empty series', () => {
    expect(offerTimeline([])).toEqual([]);
  });
});
