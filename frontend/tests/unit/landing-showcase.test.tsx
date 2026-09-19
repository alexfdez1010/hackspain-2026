import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LandingShowcase } from '@/components/layout/landing-showcase';
import { FEATURE_DITHER } from '@/lib/landing/landing-feature-dither';
import { LANDING_FEATURES } from '@/lib/landing/landing-features';

vi.mock('@/components/layout/pulse-band-showcase', () => ({
  PulseBandShowcase: ({ initialBand }: { initialBand: string }) => (
    <div data-band-showcase={initialBand} />
  ),
}));

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

describe('LandingShowcase', () => {
  it('renders every product page with a pressed PULSE cell and the band chart', () => {
    const html = renderToStaticMarkup(
      <LandingShowcase initialBand="fragile" />,
    );

    for (const feature of LANDING_FEATURES) {
      expect(html).toContain(feature.label);
      expect(html).toContain(feature.lead);
      expect(html).toContain(`data-feature="${feature.key}"`);
    }
    expect(html).toContain('data-band-showcase="fragile"');
    expect(html).toContain('aria-pressed="true"');
    expect(html.split('aria-pressed="false"').length - 1).toBe(
      LANDING_FEATURES.length - 1,
    );
    expect(html).toContain('aria-label="Producto"');
    expect(html).toContain('>Producto<');
    expect(html).toContain('landing-band-light');
    expect(html).toContain('aria-label="Superficies"');
    expect(html).not.toContain('rounded-xl');
    expect(html).not.toContain('data-heatmap');

    const ditherCount = html.split('data-dither').length - 1;
    expect(ditherCount).toBe(1);
    expect(html).toContain(`data-image="${FEATURE_DITHER.image}"`);
  });

  it('draws the rules as overlays so the dither field stays continuous', () => {
    const html = renderToStaticMarkup(<LandingShowcase initialBand="solid" />);
    const rows = Math.ceil(LANDING_FEATURES.length / 2);

    expect(html).not.toContain('gap-px bg-separator');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain(`repeat(${rows}, minmax(0, 1fr))`);
    expect(html).toContain('top-1/2');
    expect(html).toContain('left-1/2');
    expect(html.split('h-px w-full bg-separator').length - 1).toBe(rows - 1);
    expect(html).toContain('feature-cell');
    expect(html).toContain('feature-dither');
  });

  it('keeps hover and selected as type, not an accent fill', () => {
    const html = renderToStaticMarkup(
      <LandingShowcase initialBand="critical" />,
    );
    expect(html).toContain('feature-lead');
    expect(html).toContain('[--button-bg-hover:transparent]');
    expect(html).toContain('[--button-bg-pressed:transparent]');
    expect(html).toContain('text-foreground');
    expect(html).toContain('text-muted');

    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('.feature-dither');
    expect(css).toContain('opacity: 0.45');
    expect(css).toContain('.feature-lead');
    expect(css).toContain(":hover:not(:has([aria-pressed='true']))");
    expect(css).toContain('color-mix(in srgb, var(--foreground) 4%');
    expect(css).toContain("[aria-pressed='true']) .feature-lead");
    expect(css).not.toContain('.feature-cell::after');
    expect(css).not.toContain('background: var(--accent)');
    const featureBlock = css.slice(
      css.indexOf('.feature-dither {'),
      css.indexOf('.feature-dither-ink {'),
    );
    expect(featureBlock).toContain('opacity: 0.45');
    expect(featureBlock).toContain('isolation: isolate');
    expect(featureBlock).not.toContain('mix-blend-mode');
    const inkBlock = css.slice(
      css.indexOf('.feature-dither-ink {'),
      css.indexOf('.feature-cell {'),
    );
    expect(inkBlock).toContain('mix-blend-mode: screen');
  });

  it('uses the product palette on both bands, defined on the section', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    const lightBlock = css.slice(
      css.indexOf('.landing-band-light {'),
      css.indexOf('@theme inline'),
    );
    expect(lightBlock).toContain('--background: #ffffff');
    expect(lightBlock).toContain('--foreground: #0d1130');
    expect(lightBlock).toContain('--separator: #e4e7ee');
    expect(lightBlock).toContain('--score-critical: #c62a2f');
    expect(lightBlock).toContain('background-color: var(--background)');
    const darkBlock = css.slice(
      css.indexOf('.landing-band-dark {'),
      css.indexOf('.landing-band-light {'),
    );
    expect(darkBlock).toContain('--background: #050b2c');
    expect(darkBlock).toContain('--muted: #c3cada');
    expect(darkBlock).toContain('--separator: #ffffff1f');
  });
});
