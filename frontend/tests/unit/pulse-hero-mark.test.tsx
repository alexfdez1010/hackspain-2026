import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseHeroMark } from '@/components/layout/pulse-hero-mark';
import { PULSE_MARK_VIEWBOX } from '@/components/layout/pulse-mark';

describe('PulseHeroMark', () => {
  it('draws the shared mark in the current text colour', () => {
    const html = renderToStaticMarkup(<PulseHeroMark />);
    expect(html).toContain(`viewBox="${PULSE_MARK_VIEWBOX}"`);
    expect(html).toContain('fill="currentColor"');
    expect(html).not.toContain('--score-');
    expect(html).toContain('id="u"');
    expect(html).not.toContain('u-right');
    expect(html).toContain('28 22.72');
  });

  it('locks fill to white when tone is white', () => {
    const html = renderToStaticMarkup(<PulseHeroMark tone="white" />);
    expect(html).toContain('fill="#ffffff"');
    expect(html).not.toContain('currentColor');
  });
});
