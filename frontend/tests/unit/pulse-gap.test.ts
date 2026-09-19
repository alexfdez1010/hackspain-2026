import { describe, expect, it } from 'vitest';

import { getPulseDataSource } from '@/lib/pulse/data';
import { buildPulseGaps, knownWeight, largestPulseGap } from '@/lib/pulse/gap';
import type { PulseMosaicCell } from '@/lib/pulse/mosaic';
import { FALLBACK_PLAN_KEY, PLANS, planFor } from '@/lib/pulse/plans';
import { scoreBand } from '@/lib/score';

/**
 * Builds one cell of the mosaic with only the fields the gap reads.
 *
 * @param key - Variable key.
 * @param weight - Points of the 100 owned by the variable.
 * @param score - Score of the month, or `null` when it has no evidence.
 * @returns The cell.
 */
function cell(
  key: string,
  weight: number,
  score: number | null,
): PulseMosaicCell {
  return {
    key,
    label: key.toUpperCase(),
    pillar: 'liquidez',
    pillarLabel: 'Liquidez',
    weight,
    score,
    known: score !== null,
    band: scoreBand(score),
    rawValue: null,
    unit: 'días',
    contribution: null,
  };
}

const CELLS = [
  cell('cash_min', 14, 40),
  cell('cash_days', 12, 80),
  cell('ar90', 12, 10),
  cell('loc_util', 6, null),
];

describe('knownWeight', () => {
  it('adds only the weight of the variables the month measured', () => {
    expect(knownWeight(CELLS)).toBe(38);
  });

  it('is zero when the month measured nothing', () => {
    expect(knownWeight([cell('loc_util', 6, null)])).toBe(0);
  });
});

describe('buildPulseGaps', () => {
  it('scores every measured variable with weight · (100 − score) / peso', () => {
    const gaps = buildPulseGaps(CELLS);
    expect(gaps.map((gap) => gap.key)).toEqual([
      'ar90',
      'cash_min',
      'cash_days',
    ]);
    expect(gaps[0].points).toBeCloseTo((12 * 90) / 38, 6);
    expect(gaps[1].points).toBeCloseTo((14 * 60) / 38, 6);
  });

  it('adds up to the points the month is missing out of 100', () => {
    const gaps = buildPulseGaps(CELLS);
    const pulse = (14 * 40 + 12 * 80 + 12 * 10) / 38;
    const total = gaps.reduce((sum, gap) => sum + gap.points, 0);
    expect(total).toBeCloseTo(100 - pulse, 6);
  });

  it('leaves out the variables with no evidence', () => {
    expect(buildPulseGaps(CELLS).map((gap) => gap.key)).not.toContain(
      'loc_util',
    );
  });

  it('gives nothing back when no variable was measured', () => {
    expect(buildPulseGaps([cell('loc_util', 6, null)])).toEqual([]);
    expect(largestPulseGap([])).toBeNull();
  });

  it('names the variable worth acting on', () => {
    const gap = largestPulseGap(CELLS);
    expect(gap?.key).toBe('ar90');
    expect(gap?.label).toBe('AR90');
    expect(gap?.pillarLabel).toBe('Liquidez');
    expect(gap?.weight).toBe(12);
  });
});

describe('planFor', () => {
  it('answers with the plan written for the variable', () => {
    expect(planFor('cash_min').title).toContain('calendario de pagos');
    expect(planFor('ar90').title).toBe('Limpia la cartera vencida');
    expect(planFor('ar90').steps).toHaveLength(3);
  });

  it('falls back to the heaviest variable for an unplanned one', () => {
    expect(planFor('loc_util')).toBe(PLANS[FALLBACK_PLAN_KEY]);
    expect(planFor('nope')).toBe(PLANS.cash_min);
  });

  it('keeps three steps, a cost and a horizon in every plan', () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.steps).toHaveLength(3);
      expect(plan.title.length).toBeGreaterThan(0);
      expect(plan.cost.length).toBeGreaterThan(0);
      expect(plan.horizon.length).toBeGreaterThan(0);
    }
  });

  it('only plans variables the export publishes', async () => {
    const { meta } = await getPulseDataSource().getSummary();
    const published = meta.variables.map((variable) => variable.key);
    for (const key of Object.keys(PLANS)) {
      expect(published).toContain(key);
    }
  });
});
