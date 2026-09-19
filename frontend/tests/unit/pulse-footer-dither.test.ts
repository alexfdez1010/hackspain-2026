import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { FEATURE_DITHER } from '@/lib/landing/landing-feature-dither';
import { FOOTER_DITHER } from '@/lib/landing/pulse-footer-dither';
import { PULSE_FOOTER_HEATMAP_IMAGE } from '@/lib/landing/pulse-footer-heatmap';
import { PULSE_HERO_DITHER_IMAGE } from '@/lib/landing/pulse-hero-dither';

describe('FOOTER_DITHER', () => {
  it('crops a rotated fragment of the hero sparkle, not the 2×2 field', () => {
    expect(FOOTER_DITHER.image).toBe(PULSE_HERO_DITHER_IMAGE);
    expect(FOOTER_DITHER.image).toBe(FEATURE_DITHER.image);
    expect(FOOTER_DITHER.image).not.toBe(PULSE_FOOTER_HEATMAP_IMAGE);
    expect(FOOTER_DITHER.image).not.toContain('pulse-wordmark');
    expect(FOOTER_DITHER.image).not.toContain('paper.design');
    expect(
      existsSync(resolve(process.cwd(), `public${FOOTER_DITHER.image}`)),
    ).toBe(true);

    expect(FOOTER_DITHER.colorBack).toBe('#00000000');
    expect(FOOTER_DITHER.colorFront).toBe('#afafbb');
    expect(FOOTER_DITHER.colorHighlight).toBe('#ffffff');
    expect(FOOTER_DITHER.originalColors).toBe(false);
    expect(FOOTER_DITHER.inverted).toBe(false);
    expect(FOOTER_DITHER.fit).toBe('cover');
    expect(FOOTER_DITHER.originX).toBe(0.68);
    expect(FOOTER_DITHER.originY).toBe(0.32);
    expect(FOOTER_DITHER.scale).toBe(2.4);
    expect(FOOTER_DITHER.rotation).toBe(28);
    expect(FOOTER_DITHER.originX).not.toBe(FEATURE_DITHER.originX);
    expect(FOOTER_DITHER.originY).not.toBe(FEATURE_DITHER.originY);
    expect(FOOTER_DITHER.scale).not.toBe(FEATURE_DITHER.scale);
    expect(FOOTER_DITHER.rotation).not.toBe(FEATURE_DITHER.rotation);
    expect(FOOTER_DITHER.type).toBe('4x4');
    expect(FOOTER_DITHER.size).toBe(3.5);
    expect(FOOTER_DITHER.colorSteps).toBe(2);
    expect(JSON.stringify(FOOTER_DITHER)).not.toContain('--score-');
  });
});
