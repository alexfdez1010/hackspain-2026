import { describe, expect, it } from 'vitest';

import { SCORE_BANDS, SCORE_GUIDES, scoreBand, scoreColor } from '@/lib/score';

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

describe('SCORE_GUIDES', () => {
  it('matches the boundaries between bands', () => {
    expect(SCORE_GUIDES).toEqual(SCORE_BANDS.slice(1).map((band) => band.min));
  });
});
