import { describe, expect, it } from 'vitest';

import { companySections } from '@/lib/company/sections';
import {
  LANDING_FEATURE_IDS,
  LANDING_FEATURE_KEYS,
  LANDING_FEATURES,
  landingFeature,
} from '@/lib/landing/landing-features';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';

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

  it('gives every page a lead that says what it answers', () => {
    for (const feature of LANDING_FEATURES) {
      expect(feature.lead.length).toBeGreaterThan(10);
      expect(feature.lead).not.toBe(feature.label);
    }
  });

  it('falls back to PULSE when the id is unknown', () => {
    expect(landingFeature('pulse').label).toBe('PULSE');
    expect(landingFeature('missing').key).toBe('pulse');
  });
});
