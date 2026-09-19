import { describe, expect, it } from 'vitest';

import {
  LANDING_FEATURES,
  landingFeature,
  landingPreview,
} from '@/lib/landing/landing-features';

describe('LANDING_FEATURES', () => {
  it('lists the four product surfaces in reading order', () => {
    expect(LANDING_FEATURES).toHaveLength(4);
    expect(LANDING_FEATURES.map((feature) => feature.id)).toEqual([
      'pulse',
      'forecast',
      'advisor',
      'method',
    ]);
    expect(LANDING_FEATURES.map((feature) => feature.label)).toEqual([
      'PULSE',
      'Previsión',
      'Recomendaciones',
      'Método',
    ]);
  });

  it('falls back to PULSE when the id is unknown', () => {
    expect(landingFeature('pulse').label).toBe('PULSE');
    expect(landingFeature('missing').id).toBe('pulse');
  });

  it('reserves the animated preview for PULSE', () => {
    expect(landingPreview('pulse')).toBe('pulse-animation');
    expect(landingPreview('forecast')).toBe('chart');
    expect(landingPreview('advisor')).toBe('chart');
    expect(landingPreview('method')).toBe('chart');
  });
});
