import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LandingFooter } from '@/components/layout/landing-footer';
import { PULSE_FOOTER_HEATMAP_IMAGE } from '@/lib/landing/pulse-footer-heatmap';
import { DEMO_COMPANY_ID } from '@/lib/xray/demo';

vi.mock('@paper-design/shaders-react', () => ({
  Heatmap: ({
    image,
    speed,
    'aria-hidden': ariaHidden,
  }: {
    image: string;
    speed: number;
    'aria-hidden'?: boolean | 'true' | 'false';
  }) => (
    <div
      data-heatmap=""
      data-image={image}
      data-speed={String(speed)}
      aria-hidden={ariaHidden}
    />
  ),
}));

describe('LandingFooter', () => {
  it('lists Platform and Docs in the right pane, with legal links and no mark', () => {
    const html = renderToStaticMarkup(<LandingFooter />);
    expect(html).toContain('Platform');
    expect(html).toContain('Docs');
    expect(html).toContain('href="/radar"');
    expect(html).toContain('href="/capital"');
    expect(html).toContain('href="/metodo"');
    expect(html).toContain(`href="/empresa/${DEMO_COMPANY_ID}"`);
    expect(html).toContain('href="/condiciones"');
    expect(html).toContain('href="/privacidad"');
    expect(html).toContain('© 2026 Pulse');
    expect(html).not.toContain('<h2');
    expect(html).not.toContain('Embat');
    expect(html).not.toContain('HackSpain');
    expect(html).not.toContain('justify-end');
  });

  it('puts the Heatmap in the desktop-only left pane', () => {
    const html = renderToStaticMarkup(<LandingFooter />);
    expect(html).toContain('footer-heatmap');
    expect(html).toContain('hidden h-full min-h-0 overflow-hidden lg:block');
    expect(html).toContain(`data-image="${PULSE_FOOTER_HEATMAP_IMAGE}"`);
    expect(html).toContain('data-heatmap');
    expect(html).toContain('aria-hidden');
  });
});
