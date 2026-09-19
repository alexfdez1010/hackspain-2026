import { describe, expect, it } from 'vitest';

import {
  heatmapSpeed,
  PULSE_FOOTER_HEATMAP,
  PULSE_FOOTER_HEATMAP_IMAGE,
  PULSE_FOOTER_HEATMAP_SPEED,
} from '@/lib/landing/pulse-footer-heatmap';

describe('heatmapSpeed', () => {
  it('freezes the loop when motion is reduced', () => {
    expect(heatmapSpeed(true)).toBe(0);
    expect(heatmapSpeed(false)).toBe(PULSE_FOOTER_HEATMAP_SPEED);
  });
});

describe('PULSE_FOOTER_HEATMAP', () => {
  it('keeps Tender iris geometry and an Embat color ramp', () => {
    expect(PULSE_FOOTER_HEATMAP.noise).toBe(0.73);
    expect(PULSE_FOOTER_HEATMAP.contour).toBe(0.423);
    expect(PULSE_FOOTER_HEATMAP.angle).toBe(-158);
    expect(PULSE_FOOTER_HEATMAP.innerGlow).toBe(0.13);
    expect(PULSE_FOOTER_HEATMAP.outerGlow).toBe(0.02);
    expect(PULSE_FOOTER_HEATMAP.scale).toBe(0.58);
    expect(PULSE_FOOTER_HEATMAP.colorBack).toBe('#00000000');
    expect(PULSE_FOOTER_HEATMAP.colors).toEqual([
      '#050b2c',
      '#232845',
      '#3878f6',
      '#5c92fe',
      '#ffffff',
    ]);
    expect(PULSE_FOOTER_HEATMAP.image).toBe(PULSE_FOOTER_HEATMAP_IMAGE);
    expect(PULSE_FOOTER_HEATMAP_IMAGE).toBe('/pulse-wordmark.svg');
    expect(PULSE_FOOTER_HEATMAP_IMAGE).not.toContain('paper.design');
  });
});
