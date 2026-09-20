import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LandingFeaturePreview } from '@/components/layout/landing-feature-preview';
import {
  DIAGNOSIS_PREVIEW,
  FINANCING_PREVIEW,
  SIGNAL_PREVIEW,
} from '@/lib/landing/feature-previews';
import { formatEuroExact } from '@/lib/advisor/format';
import { LIGHT_SCORE } from '@/lib/landing/pulse-showcase-svg';
import { SIGNAL_KINDS } from '@/lib/pulse/signals';

describe('LandingFeaturePreview', () => {
  it('draws the PULSE trajectory and not the other figures', () => {
    const html = renderToStaticMarkup(
      <LandingFeaturePreview featureId="pulse" />,
    );
    expect(html).toContain('data-preview="pulse"');
    expect(html).toContain(`stroke="${LIGHT_SCORE.critical}"`);
    expect(html).toContain('id="pulse-observed"');
    expect(html).not.toContain('data-preview="diagnosis"');
    expect(html).not.toContain('data-preview="signals"');
    expect(html).not.toContain('data-preview="advisor"');
    expect(html).not.toContain(DIAGNOSIS_PREVIEW.notice);
  });

  it('shows the diagnosis notice instead of a trajectory', () => {
    const html = renderToStaticMarkup(
      <LandingFeaturePreview featureId="diagnosis" />,
    );
    expect(html).toContain('data-preview="diagnosis"');
    expect(html).toContain(DIAGNOSIS_PREVIEW.notice);
    for (const variable of DIAGNOSIS_PREVIEW.variables) {
      expect(html).toContain(variable.label);
    }
    expect(html).not.toContain('id="pulse-observed"');
    expect(html).not.toContain('data-preview="pulse"');
  });

  it('renders one alert with its kind chip', () => {
    const html = renderToStaticMarkup(
      <LandingFeaturePreview featureId="signals" />,
    );
    expect(html).toContain('data-preview="signals"');
    expect(html).toContain(SIGNAL_KINDS.bache.label);
    expect(html).toContain(SIGNAL_PREVIEW.headline);
    expect(html).toContain(SIGNAL_PREVIEW.status);
    expect(html).toContain('#6e7488');
    expect(html).toContain('color-mix(in srgb, #0d1130 4%, transparent)');
    expect(html).toContain('justify-center');
    expect(html).not.toContain('#f7f8fa');
    expect(html).not.toContain('Ver todas');
    expect(html).not.toContain('id="pulse-observed"');
    expect(html).not.toContain('rounded-xl');
    expect(html).not.toContain('rounded-full');
    expect(html).not.toContain('feedback-danger');
    expect(html).not.toContain('surface-raised');
  });

  it('shows the approved amount and the pillar shift', () => {
    const html = renderToStaticMarkup(
      <LandingFeaturePreview featureId="advisor" />,
    );
    expect(html).toContain('data-preview="advisor"');
    expect(html).toContain(formatEuroExact(FINANCING_PREVIEW.amount));
    expect(html).toContain(FINANCING_PREVIEW.product);
    expect(html).toContain(FINANCING_PREVIEW.pillar);
    expect(html).toContain('hoy ·');
    expect(html).toContain('objetivo ·');
    expect(html).not.toContain('id="pulse-observed"');
  });
});
