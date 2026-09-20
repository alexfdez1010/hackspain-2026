import { describe, expect, it } from 'vitest';

import { companySections } from '@/lib/company/sections';
import {
  bandFeature,
  featureBand,
  LANDING_FEATURE_IDS,
  LANDING_FEATURE_KEYS,
  LANDING_FEATURES,
  landingFeature,
} from '@/lib/landing/landing-features';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { SCORE_BANDS } from '@/lib/score';

describe('LANDING_FEATURES', () => {
  it('lists the four pages of the 2×2, in nav order, with their nav routes', () => {
    const sections = companySections(PULSE_DEMO_COMPANY_ID).filter((section) =>
      LANDING_FEATURE_KEYS.includes(section.key),
    );
    expect(LANDING_FEATURE_KEYS).toEqual([
      'pulse',
      'diagnosis',
      'signals',
      'advisor',
    ]);
    expect(LANDING_FEATURES).toHaveLength(4);
    expect(LANDING_FEATURES.map((feature) => feature.key)).toEqual(
      sections.map((section) => section.key),
    );
    expect(LANDING_FEATURES.map((feature) => feature.href)).toEqual(
      sections.map((section) => section.href),
    );
    expect(LANDING_FEATURE_IDS).toEqual(sections.map((section) => section.key));
    expect(LANDING_FEATURES.map((feature) => feature.label)).toEqual([
      'PULSE',
      'Diagnóstico',
      'Alertas',
      'Financiación',
    ]);
  });

  it('gives every page a lead that says what it answers, in two sentences', () => {
    for (const feature of LANDING_FEATURES) {
      expect(feature.lead.length).toBeGreaterThan(10);
      expect(feature.lead).not.toBe(feature.label);
      expect(feature.lead.split('. ').length).toBeGreaterThanOrEqual(2);
    }
  });

  it('falls back to PULSE when the id is unknown', () => {
    expect(landingFeature('pulse').label).toBe('PULSE');
    expect(landingFeature('missing').key).toBe('pulse');
  });

  it('maps each cell to a score band in reading order, and back', () => {
    expect(LANDING_FEATURE_KEYS).toHaveLength(SCORE_BANDS.length);
    expect(featureBand('pulse')).toBe('critical');
    expect(featureBand('diagnosis')).toBe('fragile');
    expect(featureBand('signals')).toBe('neutral');
    expect(featureBand('advisor')).toBe('solid');
    expect(featureBand('missing')).toBe('critical');
    expect(bandFeature('critical')).toBe('pulse');
    expect(bandFeature('fragile')).toBe('diagnosis');
    expect(bandFeature('neutral')).toBe('signals');
    expect(bandFeature('solid')).toBe('advisor');
    expect(bandFeature('unknown')).toBe('pulse');
  });
});
