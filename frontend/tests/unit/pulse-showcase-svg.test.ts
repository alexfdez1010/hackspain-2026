import { describe, expect, it } from 'vitest';

import {
  showcaseMotionPaused,
  withPulseShowcaseMotion,
} from '@/lib/landing/pulse-showcase-motion';
import {
  pulseShowcaseLabel,
  pulseShowcaseSvg,
} from '@/lib/landing/pulse-showcase-svg';
import { buildTrajectory } from '@/lib/pulse/company-view';
import { makeForecastPoint, makeSeriesPoint } from './pulse-fixtures';

const SERIES = [
  makeSeriesPoint({ month: '2026-01', pulse: 64.81 }),
  makeSeriesPoint({ month: '2026-08', pulse: 45.64 }),
];

const FORECAST = [
  makeForecastPoint({
    horizon: 1,
    targetMonth: '2026-09',
    pulsePred: 45.12,
    pulseP10: 36.67,
    pulseP90: 53.47,
  }),
  makeForecastPoint({
    horizon: 12,
    targetMonth: '2027-08',
    pulsePred: 45.07,
    pulseP10: 25.87,
    pulseP90: 62.79,
  }),
];

describe('pulseShowcaseSvg', () => {
  it('returns empty without observed history', () => {
    const { points, boundaryIndex } = buildTrajectory([], FORECAST);
    expect(pulseShowcaseSvg(points, boundaryIndex)).toBe('');
    expect(pulseShowcaseLabel(points, boundaryIndex)).toBe('');
  });

  it('draws guides, a closed band, observed and dashed forecast', () => {
    const { points, boundaryIndex } = buildTrajectory(SERIES, FORECAST);
    const svg = pulseShowcaseSvg(points, boundaryIndex);
    expect(svg).toContain('id="pulse-guides"');
    expect(svg).toContain('>35</text>');
    expect(svg).toContain('>50</text>');
    expect(svg).toContain('>65</text>');
    expect(svg).toContain('id="pulse-band"');
    expect(svg).toMatch(/id="pulse-band"[^>]*Z"/);
    expect(svg).toContain('id="pulse-observed"');
    expect(svg).toContain('id="pulse-forecast"');
    expect(svg).toContain('stroke-dasharray="6 4"');
    expect(svg).toContain('id="pulse-close"');
    expect(svg).toContain('>45,6</text>');
    expect(svg).toContain('>ene</text>');
    expect(svg).toContain('>ago</text>');
    expect(svg).not.toContain('NaN');
    expect(svg).not.toContain('figcaption');
    expect(svg).not.toContain('var(--score-');
    expect(svg).toContain('oklch(0.72 0.15 72)');
  });

  it('labels only the first close, last close and farthest horizon', () => {
    const { points, boundaryIndex } = buildTrajectory(SERIES, FORECAST);
    const svg = pulseShowcaseSvg(points, boundaryIndex);
    expect(svg).toContain('>ene</text>');
    expect(svg).not.toContain('>sep</text>');
    expect(pulseShowcaseLabel(points, boundaryIndex)).toContain(
      'desde ene 2026 hasta ago 2026',
    );
    expect(pulseShowcaseLabel(points, boundaryIndex)).toContain(
      'previsión hasta ago 2027',
    );
  });
});

describe('withPulseShowcaseMotion', () => {
  it('leaves empty input alone and tags drawable paths', () => {
    expect(withPulseShowcaseMotion('')).toBe('');
    const { points, boundaryIndex } = buildTrajectory(SERIES, FORECAST);
    const animated = withPulseShowcaseMotion(
      pulseShowcaseSvg(points, boundaryIndex),
    );
    expect(animated).toContain('pathLength="1"');
    expect(animated).toContain('@keyframes pulse-draw');
    expect(animated).toContain('prefers-reduced-motion');
  });
});

describe('showcaseMotionPaused', () => {
  it('freezes when the user asks for less motion', () => {
    expect(showcaseMotionPaused(true)).toBe(true);
    expect(showcaseMotionPaused(false)).toBe(false);
  });
});
