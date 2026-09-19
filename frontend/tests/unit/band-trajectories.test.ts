import { describe, expect, it } from 'vitest';

import {
  BAND_SHOWCASES,
  bandShowcaseFor,
} from '@/lib/landing/band-showcase-svg';
import {
  bandShowcaseClosesInBand,
  bandShowcaseTrajectory,
} from '@/lib/landing/band-trajectories';
import { LIGHT_SCORE } from '@/lib/landing/pulse-showcase-svg';
import { SCORE_BANDS } from '@/lib/score';

describe('bandShowcaseTrajectory', () => {
  it('closes every band inside its own range, then forecasts twelve months', () => {
    for (const band of SCORE_BANDS) {
      const { points, boundaryIndex } = bandShowcaseTrajectory(band.key);
      expect(boundaryIndex).toBe(7);
      expect(points).toHaveLength(20);
      expect(bandShowcaseClosesInBand(band.key)).toBe(true);
      expect(points[0].month).toBe('2026-01');
      expect(points[boundaryIndex].month).toBe('2026-08');
      expect(points[8].month).toBe('2026-09');
      expect(points[19].month).toBe('2027-08');
      expect(points[0].kind).toBe('observed');
      expect(points[19].kind).toBe('forecast');
    }
  });

  it('widens the p10-p90 band with the horizon and stays in 0-100', () => {
    const { points } = bandShowcaseTrajectory('critical');
    const near = points[8];
    const far = points[19];
    expect(near.p90! - near.p10!).toBeLessThan(far.p90! - far.p10!);
    for (const point of points.slice(8)) {
      expect(point.p10).toBeGreaterThanOrEqual(0);
      expect(point.p90).toBeLessThanOrEqual(100);
      expect(point.value).not.toBeNull();
    }
  });

  it('is deterministic', () => {
    expect(bandShowcaseTrajectory('solid')).toEqual(
      bandShowcaseTrajectory('solid'),
    );
  });
});

describe('BAND_SHOWCASES', () => {
  it('paints each chart in the colour of its band', () => {
    expect(BAND_SHOWCASES.map((showcase) => showcase.band)).toEqual(
      SCORE_BANDS.map((band) => band.key),
    );
    for (const showcase of BAND_SHOWCASES) {
      expect(showcase.svg).toContain(`stroke="${LIGHT_SCORE[showcase.band]}"`);
      expect(showcase.svg).toContain('@keyframes pulse-draw');
      expect(showcase.label).toContain('previsión hasta ago 2027');
    }
  });

  it('falls back to the first band for an unknown key', () => {
    expect(bandShowcaseFor('nope').band).toBe('critical');
    expect(bandShowcaseFor('solid').band).toBe('solid');
  });
});
