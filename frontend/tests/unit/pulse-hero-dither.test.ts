import { describe, expect, it } from 'vitest';

import {
  PULSE_HERO_DITHER,
  PULSE_HERO_DITHER_IMAGE,
} from '@/lib/landing/pulse-hero-dither';

describe('PULSE_HERO_DITHER', () => {
  it('is a local sparkle field with a transparent back and no Pulse lockup', () => {
    expect(PULSE_HERO_DITHER.image).toBe(PULSE_HERO_DITHER_IMAGE);
    expect(PULSE_HERO_DITHER_IMAGE).toBe('/hero-dither.webp');
    expect(PULSE_HERO_DITHER_IMAGE).not.toContain('paper.design');
    expect(PULSE_HERO_DITHER_IMAGE).not.toContain('pulse-wordmark');
    expect(PULSE_HERO_DITHER.originalColors).toBe(false);
    expect(PULSE_HERO_DITHER.colorBack).toBe('#00000000');
    expect(PULSE_HERO_DITHER.colorFront).toBe('#afafbb');
    expect(PULSE_HERO_DITHER.colorHighlight).toBe('#ffffff');
    expect(PULSE_HERO_DITHER.type).toBe('4x4');
    expect(PULSE_HERO_DITHER.size).toBe(3.5);
    expect(PULSE_HERO_DITHER.colorSteps).toBe(2);
    expect(PULSE_HERO_DITHER.scale).toBe(0.86);
    expect(PULSE_HERO_DITHER.fit).toBe('contain');
    expect(PULSE_HERO_DITHER.maxPixelCount).toBe(480_000);
    expect(JSON.stringify(PULSE_HERO_DITHER)).not.toContain('--score-');
  });
});
