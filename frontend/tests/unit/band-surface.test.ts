import { describe, expect, it } from 'vitest';

import { bandSurfaceStyle } from '@/lib/pulse/band';

describe('bandSurfaceStyle', () => {
  it('washes the card with the colour of the band of the score', () => {
    expect(bandSurfaceStyle(20)?.background).toContain('var(--score-critical)');
    expect(bandSurfaceStyle(40)?.borderColor).toContain('var(--score-fragile)');
    expect(bandSurfaceStyle(60)?.background).toContain('var(--score-neutral)');
    expect(bandSurfaceStyle(90)?.background).toContain('var(--score-solid)');
  });

  it('mixes with the neutral tokens so both themes keep their surface', () => {
    const style = bandSurfaceStyle(20);
    expect(style?.background).toContain('var(--surface-raised)');
    expect(style?.borderColor).toContain('var(--border-subtle)');
  });

  it('leaves the surface plain without a score', () => {
    expect(bandSurfaceStyle(null)).toBeUndefined();
    expect(bandSurfaceStyle(Number.NaN)).toBeUndefined();
  });
});
