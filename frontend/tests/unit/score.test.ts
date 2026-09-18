import { describe, expect, it } from 'vitest';

import {
  DIRECTION_LABELS,
  REGIME_HINTS,
  REGIME_LABELS,
  SCORE_BANDS,
  directionColor,
  regimeColor,
  scoreBand,
  scoreColor,
} from '@/lib/xray/score';

describe('scoreBand', () => {
  it.each([
    [0, 'critical'],
    [34.99, 'critical'],
    [35, 'fragile'],
    [49.99, 'fragile'],
    [50, 'neutral'],
    [64.99, 'neutral'],
    [65, 'solid'],
    [100, 'solid'],
  ])('maps %s to the %s band', (score, expected) => {
    expect(scoreBand(score).key).toBe(expected);
  });

  it('falls back to the neutral band without a score', () => {
    expect(scoreBand(null).key).toBe('neutral');
    expect(scoreBand(Number.NaN).key).toBe('neutral');
  });

  it('exposes one colour token per band', () => {
    const colors = SCORE_BANDS.map((band) => band.color);
    expect(new Set(colors).size).toBe(SCORE_BANDS.length);
    for (const color of colors) expect(color).toMatch(/^var\(--score-/);
  });
});

describe('scoreColor', () => {
  it('returns the colour of the band the score falls into', () => {
    expect(scoreColor(10)).toBe('var(--score-critical)');
    expect(scoreColor(40)).toBe('var(--score-fragile)');
    expect(scoreColor(60)).toBe('var(--score-neutral)');
    expect(scoreColor(90)).toBe('var(--score-solid)');
  });
});

describe('semantic colours', () => {
  it('maps directions to intent colours', () => {
    expect(directionColor('improving')).toBe('success');
    expect(directionColor('stable')).toBe('default');
    expect(directionColor('deteriorating')).toBe('danger');
  });

  it('maps regimes to intent colours', () => {
    expect(regimeColor('structural_decline')).toBe('danger');
    expect(regimeColor('structural_improvement')).toBe('success');
    expect(regimeColor('transient_dip')).toBe('warning');
    expect(regimeColor('steady')).toBe('default');
  });
});

describe('labels', () => {
  it('translates every direction and regime', () => {
    for (const label of Object.values(DIRECTION_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
    for (const key of Object.keys(REGIME_LABELS)) {
      expect(REGIME_HINTS[key as keyof typeof REGIME_HINTS]).toBeTruthy();
    }
  });
});
