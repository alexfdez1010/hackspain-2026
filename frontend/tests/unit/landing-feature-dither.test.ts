import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { FEATURE_DITHER } from '@/lib/landing/landing-feature-dither';
import { PULSE_FOOTER_HEATMAP_IMAGE } from '@/lib/landing/pulse-footer-heatmap';
import { PULSE_HERO_DITHER_IMAGE } from '@/lib/landing/pulse-hero-dither';

describe('FEATURE_DITHER', () => {
  it('covers the 2×2 with one hero sparkle field', () => {
    expect(FEATURE_DITHER.image).toBe(PULSE_HERO_DITHER_IMAGE);
    expect(FEATURE_DITHER.image).not.toBe(PULSE_FOOTER_HEATMAP_IMAGE);
    expect(FEATURE_DITHER.image).not.toContain('pulse-wordmark');
    expect(FEATURE_DITHER.image).not.toContain('feature-dither-');
    expect(FEATURE_DITHER.image).not.toContain('paper.design');
    expect(
      existsSync(resolve(process.cwd(), `public${FEATURE_DITHER.image}`)),
    ).toBe(true);

    expect(FEATURE_DITHER.colorBack).toBe('#00000000');
    expect(FEATURE_DITHER.colorFront).toBe('#050b2c');
    expect(FEATURE_DITHER.originalColors).toBe(false);
    expect(FEATURE_DITHER.inverted).toBe(false);
    expect(FEATURE_DITHER.fit).toBe('cover');
    expect(FEATURE_DITHER.originX).toBe(0.5);
    expect(FEATURE_DITHER.originY).toBe(0.5);
    expect(FEATURE_DITHER.scale).toBe(1);
    expect(FEATURE_DITHER.type).toBe('4x4');
    expect(FEATURE_DITHER.size).toBe(3.5);
    expect(FEATURE_DITHER.colorSteps).toBe(2);
    expect(FEATURE_DITHER.rotation).toBe(0);
    expect(JSON.stringify(FEATURE_DITHER)).not.toContain('--score-');
  });
});
