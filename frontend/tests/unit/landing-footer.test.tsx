import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LandingFooter } from '@/components/layout/landing-footer';
import { FOOTER_DITHER } from '@/lib/landing/pulse-footer-dither';
import { PULSE_FOOTER_HEATMAP_IMAGE } from '@/lib/landing/pulse-footer-heatmap';
import { companySections } from '@/lib/company/sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { companyRoutes } from '@/lib/routes';

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
  ImageDithering: ({
    image,
    'aria-hidden': ariaHidden,
  }: {
    image: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }) => <div data-dither="" data-image={image} aria-hidden={ariaHidden} />,
}));

const demo = companyRoutes(PULSE_DEMO_COMPANY_ID);

describe('LandingFooter', () => {
  it('lists every product page in the right pane, with the copyright and no legal links', () => {
    const html = renderToStaticMarkup(<LandingFooter />);
    expect(html).toContain('landing-band-dark');
    expect(html).toContain('Producto');
    expect(html).toContain('Documentación');
    for (const section of companySections(PULSE_DEMO_COMPANY_ID)) {
      expect(html).toContain(`href="${section.href}"`);
    }
    expect(html).toContain(`href="${demo.method}"`);
    expect(html).not.toContain('href="/condiciones"');
    expect(html).not.toContain('href="/privacidad"');
    expect(html).not.toContain('Condiciones de uso');
    expect(html).not.toContain('Política de privacidad');
    expect(html).toContain('© 2026 Pulse');
    expect(html).toContain('By humans for humans.');
    expect(html).not.toContain('<h2');
    expect(html).not.toContain('Embat');
    expect(html).not.toContain('HackSpain');
    expect(html).not.toContain('justify-end');
    expect(html).not.toContain('href="/radar"');
  });

  it('puts the Heatmap in the desktop-only left pane', () => {
    const html = renderToStaticMarkup(<LandingFooter />);
    expect(html).toContain('footer-heatmap');
    expect(html).toContain('hidden h-full min-h-0 overflow-hidden lg:block');
    expect(html).toContain(`data-image="${PULSE_FOOTER_HEATMAP_IMAGE}"`);
    expect(html).toContain('data-heatmap');
    expect(html).toContain('aria-hidden');
  });

  it('puts a dark-band sparkle dither behind the lists, not the heatmap silhouette', () => {
    const html = renderToStaticMarkup(<LandingFooter />);
    expect(html).toContain('footer-dither');
    expect(html).toContain('data-dither');
    expect(html).toContain(`data-image="${FOOTER_DITHER.image}"`);
    expect(html).toContain('hero-dither.webp');
    expect(html.split('data-dither').length - 1).toBe(1);

    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toMatch(
      /\.footer-dither \{\n  opacity: 0;\n  mix-blend-mode: screen;/,
    );
    expect(css).toContain("[data-band='2'] .footer-dither");
    expect(css).toContain('opacity: 0.22');
    expect(html).not.toContain(
      `data-dither="" data-image="${PULSE_FOOTER_HEATMAP_IMAGE}"`,
    );
  });
});
