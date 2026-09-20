import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import LandingPage from '@/app/page';
import { HeroAccess } from '@/components/layout/hero-access';
import { PRODUCT_TAGLINE } from '@/lib/brand';
import { PulseHeroDither } from '@/components/layout/pulse-hero-dither';
import { PULSE_MARK_VIEWBOX } from '@/components/layout/pulse-mark';
import { PULSE_HERO_DITHER_IMAGE } from '@/lib/landing/pulse-hero-dither';

vi.mock('@paper-design/shaders-react', () => ({
  ImageDithering: ({
    image,
    'aria-hidden': ariaHidden,
  }: {
    image: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }) => <div data-dither="" data-image={image} aria-hidden={ariaHidden} />,
  Heatmap: () => <div data-heatmap="" />,
}));

describe('PulseHeroDither', () => {
  it('mounts a decorative ImageDithering with the local sparkle source', () => {
    const html = renderToStaticMarkup(<PulseHeroDither />);
    expect(html).toContain('hero-dither-canvas');
    expect(html).toContain('data-dither');
    expect(html).toContain('aria-hidden');
    expect(html).toContain(`data-image="${PULSE_HERO_DITHER_IMAGE}"`);
    expect(html).not.toContain('data-ready');
    expect(html).not.toContain('pulse-wordmark');
  });
});

describe('the landing hero', () => {
  it('puts the dither in the left pane, not under HeroAccess, without the mark', async () => {
    const html = renderToStaticMarkup(await LandingPage());
    expect(html).toContain('landing-band-dark');
    expect(html).toContain('hero-dither');
    expect(html).toContain('data-dither');
    expect(html).toContain('aria-label="Dashboard"');
    expect(html).toContain('>Embat Pulse<');
    expect(html).toContain('aria-label="Embat Pulse, inicio"');
    expect(html).toContain(PRODUCT_TAGLINE);
    expect(html).toContain('aria-label="Niveles del score"');
    expect(html).not.toContain(PULSE_MARK_VIEWBOX);
    expect(html).not.toContain('hero-grain');

    const barAt = html.indexOf('aria-label="Embat Pulse, inicio"');
    const ditherAt = html.indexOf('hero-dither');
    expect(barAt).toBeGreaterThan(-1);
    expect(barAt).toBeLessThan(ditherAt);
    const accessAt = html.indexOf('aria-label="Dashboard"');
    expect(ditherAt).toBeGreaterThan(-1);
    expect(accessAt).toBeGreaterThan(ditherAt);

    const access = renderToStaticMarkup(<HeroAccess />);
    expect(access).not.toContain('hero-dither');
    expect(access).not.toContain('data-dither');
  });

  it('keeps the sparkle file in public and hides the dither after the hero band', () => {
    expect(existsSync(resolve(process.cwd(), 'public/hero-dither.webp'))).toBe(
      true,
    );

    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('.hero-dither');
    expect(css).toContain('mix-blend-mode: screen');
    expect(css).toContain('.hero-dither-canvas');
    expect(css).toContain('.hero-dither-canvas[data-ready]');
    expect(css).toContain('opacity: 0');
    expect(css).toContain('500ms ease-out');
    expect(css).toContain("[data-landing-snap][data-band='1'] .hero-dither");
    expect(css).toContain("[data-landing-snap][data-band='2'] .hero-dither");
    expect(css).not.toContain('.hero-grain');

    const page = readFileSync(
      resolve(process.cwd(), 'src/app/page.tsx'),
      'utf8',
    );
    expect(page).toContain('preload(');
    expect(page).toContain('PULSE_HERO_DITHER_IMAGE');
    expect(page).toContain("as: 'image'");
    expect(page).toContain("type: 'image/webp'");
  });
});
