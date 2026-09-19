import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LandingShowcase } from '@/components/layout/landing-showcase';
import { FEATURE_DITHER } from '@/lib/landing/landing-feature-dither';
import { LANDING_FEATURES } from '@/lib/landing/landing-features';

vi.mock('@/components/charts/pulse-trajectory', () => ({
  PulseTrajectoryChart: () => <div data-trajectory="" />,
}));

vi.mock('@/components/layout/pulse-showcase-animation', () => ({
  PulseShowcaseAnimation: () => <div data-showcase="pulse-animation" />,
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
  it('renders the four feature labels with a pressed PULSE cell', () => {
    const html = renderToStaticMarkup(
      <LandingShowcase points={[]} boundaryIndex={-1} />,
    );

    for (const feature of LANDING_FEATURES) {
      expect(html).toContain(feature.label);
      expect(html).toContain(feature.lead);
    }
    expect(html).toContain('data-showcase="pulse-animation"');
    expect(html).not.toContain('data-trajectory');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Producto"');
    expect(html).toContain('landing-band-light');
    expect(html).toContain('aria-label="Superficies"');
    expect(html).not.toContain('rounded-xl');
    expect(html).not.toContain('data-heatmap');

    const ditherCount = html.split('data-dither').length - 1;
    expect(ditherCount).toBe(1);
    expect(html).toContain(`data-image="${FEATURE_DITHER.image}"`);
  });

  it('draws the plus as overlays so the dither field stays continuous', () => {
    const html = renderToStaticMarkup(
      <LandingShowcase points={[]} boundaryIndex={-1} />,
    );

    expect(html).not.toContain('gap-px bg-separator');
    expect(html).not.toContain('lg:gap-y-0');
    expect(html).toContain('grid-cols-2 grid-rows-2');
    expect(html).toContain('inset-x-[var(--site-gutter)]');
    expect(html).toContain('top-1/2');
    expect(html).toContain('left-1/2');
    expect(html).toContain('lg:hidden');
    expect(html).not.toContain('top-[18%]');
    expect(html).not.toContain('left-[12%]');
    expect(html).toContain('feature-cell');
    expect(html).toContain('feature-dither');
    for (const feature of LANDING_FEATURES) {
      expect(html).toContain(`data-feature="${feature.id}"`);
    }
  });

  it('keeps hover and selected as type, not an accent fill', () => {
    const html = renderToStaticMarkup(
      <LandingShowcase points={[]} boundaryIndex={-1} />,
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
    expect(css).toContain('opacity: 0.32');
    expect(css).toContain('.feature-lead');
    expect(css).toContain(":hover:not(:has([aria-pressed='true']))");
    expect(css).toContain('color-mix(in srgb, var(--foreground) 4%');
    expect(css).toContain("[aria-pressed='true']) .feature-lead");
    expect(css).not.toContain('.feature-cell::after');
    expect(css).not.toContain('background: var(--accent)');
    expect(css).not.toContain("data-feature='pulse'");
    expect(css).not.toContain('scale(1.08)');
    expect(css).not.toContain('scale(1.05) rotate(5deg)');
    expect(css).not.toContain('scale(1.12)');
    expect(css).not.toContain('translate(6px, 6px)');
    const featureBlock = css.slice(
      css.indexOf('.feature-dither {'),
      css.indexOf('.feature-cell {'),
    );
    expect(featureBlock).toContain('opacity: 0.32');
    expect(featureBlock).not.toContain('mix-blend-mode');
    expect(featureBlock).not.toContain('screen');
    expect(css).not.toContain('.feature-dither {\n  mix-blend-mode: screen');
  });

  it('keeps the light band tokens on the section, not the html theme', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    const lightBlock = css.slice(
      css.indexOf('.landing-band-light {'),
      css.indexOf('@theme inline'),
    );
    expect(lightBlock).toContain('--background: #fbfbfc');
    expect(lightBlock).toContain('background-color: var(--background)');
    expect(css).toContain('.landing-band-dark {');
  });
});
