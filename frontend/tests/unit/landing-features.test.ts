import { describe, expect, it } from 'vitest';

import { companySections } from '@/lib/company/sections';
import {
  LANDING_FEATURE_IDS,
  LANDING_FEATURES,
  landingFeature,
} from '@/lib/landing/landing-features';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';

describe('LANDING_FEATURES', () => {
  it('lists every product page of the demo company, in nav order', () => {
    const sections = companySections(PULSE_DEMO_COMPANY_ID);
    expect(LANDING_FEATURES.map((feature) => feature.key)).toEqual(
      sections.map((section) => section.key),
    );
    expect(LANDING_FEATURES.map((feature) => feature.href)).toEqual(
      sections.map((section) => section.href),
    );
    expect(LANDING_FEATURE_IDS).toEqual(sections.map((section) => section.key));
    expect(LANDING_FEATURES.map((feature) => feature.label)).toContain(
      'Diagnóstico',
    );
    expect(LANDING_FEATURES.map((feature) => feature.label)).toContain(
      'Alertas',
    );
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
