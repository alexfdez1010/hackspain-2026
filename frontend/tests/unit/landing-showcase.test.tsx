import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LandingShowcase } from '@/components/layout/landing-showcase';
import { FEATURE_DITHER } from '@/lib/landing/landing-feature-dither';
import { LANDING_FEATURES } from '@/lib/landing/landing-features';

vi.mock('@/components/layout/landing-feature-preview', () => ({
  LandingFeaturePreview: ({ featureId }: { featureId: string }) => (
    <div data-feature-preview={featureId} />
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
  it('links every product page, previews PULSE first and draws its figure', () => {
    const html = renderToStaticMarkup(<LandingShowcase />);

    for (const feature of LANDING_FEATURES) {
      expect(html).toContain(feature.label);
      expect(html).toContain(feature.lead);
      expect(html).toContain(`data-feature="${feature.key}"`);
      expect(html).toContain(`href="${feature.href}"`);
    }
    expect(html).toContain('data-feature-preview="pulse"');
    expect(html).not.toContain('aria-pressed');
    expect(html).not.toContain('<button');
    expect(html.split('data-selected="true"').length - 1).toBe(1);
    expect(html.split('data-selected="false"').length - 1).toBe(
      LANDING_FEATURES.length - 1,
    );
    expect(html).toContain('aria-label="Producto"');
    expect(html).not.toContain('>Producto<');
    expect(html).toContain('landing-band-light');
    expect(html).toContain('aria-label="Superficies"');
    expect(html).not.toContain('rounded-xl');
    expect(html).not.toContain('data-heatmap');

    const ditherCount = html.split('data-dither').length - 1;
    expect(ditherCount).toBe(1);
    expect(html).toContain(`data-image="${FEATURE_DITHER.image}"`);
  });

  it('draws the rules as overlays so the dither field stays continuous', () => {
    const html = renderToStaticMarkup(<LandingShowcase />);
    const rows = Math.ceil(LANDING_FEATURES.length / 2);

    expect(html).not.toContain('gap-px bg-separator');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain(`repeat(${rows}, minmax(0, 1fr))`);
    expect(html).toContain('top-1/2');
    expect(html).toContain('left-1/2');
    expect(html.split('h-px w-full bg-separator').length - 1).toBe(rows - 1);
    expect(html).toContain('feature-cell');
    expect(html).toContain('feature-dither');
    expect(html).toContain('px-4 py-2 sm:px-8');
    expect(html).toContain('flex-col justify-between px-4');
    expect(html).not.toContain('px-[var(--landing-inset)]');
    expect(html).not.toContain('sm:px-10');
  });

  it('keeps hover and selected as type, and hovers every cell alike', () => {
    const html = renderToStaticMarkup(<LandingShowcase />);
    expect(html).toContain('feature-lead');
    expect(html).toContain('text-foreground');
    expect(html).toContain('text-muted');

    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('.feature-dither');
    expect(css).toContain('opacity: 0.45');
    expect(css).toContain('.feature-lead');
    expect(css).toContain('.feature-cell:hover {');
    expect(css).not.toContain(":hover:not(:has([aria-pressed='true']))");
    expect(css).toContain('color-mix(in srgb, var(--foreground) 4%');
    expect(css).toContain("[data-selected='true']) .feature-lead");
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

  it('wires hover and focus so the figure follows the selected cell', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'src/components/layout/landing-showcase.tsx'),
      'utf8',
    );
    expect(source).toContain('onMouseEnter={() => setSelectedId(feature.key)}');
    expect(source).toContain('onFocus={() => setSelectedId(feature.key)}');
    expect(source).toContain('data-selected={selected}');
    expect(source).toContain(
      '<LandingFeaturePreview featureId={selectedId} />',
    );
    expect(source).not.toContain('featureBand(selectedId)');
    expect(source).not.toContain('bandFeature(next)');
    expect(source).not.toContain('PulseBandShowcase');
    expect(source).not.toContain('initialBand');
    expect(source).not.toContain('aria-pressed');
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
