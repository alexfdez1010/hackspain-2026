import { describe, expect, it } from 'vitest';

import { describeHits, pickOutlookHorizon } from '@/lib/method/outlook';
import type { PulseForecastHorizonEvaluation } from '@/lib/pulse/types';

const row = (horizon: number): PulseForecastHorizonEvaluation => ({
  horizon,
  rows: 10,
  maePersist: null,
  maeReversion: null,
  maeMl: null,
  gainVsPersistPct: null,
  gainVsReversionPct: null,
  directionAccuracyBigMoves: null,
  recallDeclines: 0.72,
  recallImprovements: null,
  bandCoverage: null,
});

describe('pickOutlookHorizon', () => {
  it('prefers six months and falls back to the closest one', () => {
    expect(pickOutlookHorizon([row(1), row(6), row(12)])?.horizon).toBe(6);
    expect(pickOutlookHorizon([row(1), row(3), row(12)])?.horizon).toBe(3);
    expect(pickOutlookHorizon([])).toBeNull();
  });
});

describe('describeHits', () => {
  it('rounds a recall to hits out of ten and clamps it', () => {
    expect(describeHits(0.72)).toBe('7 de cada 10');
    expect(describeHits(1.4)).toBe('10 de cada 10');
    expect(describeHits(-1)).toBe('0 de cada 10');
  });

  it('answers null when the recall is unknown', () => {
    expect(describeHits(null)).toBeNull();
    expect(describeHits(Number.NaN)).toBeNull();
  });
});
