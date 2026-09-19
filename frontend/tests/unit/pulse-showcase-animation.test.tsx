import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseShowcaseAnimation } from '@/components/layout/pulse-showcase-animation';
import {
  PULSE_SHOWCASE_ANIMATED_LABEL,
  PULSE_SHOWCASE_ANIMATED_SVG,
} from '@/lib/landing/pulse-showcase-animated';

describe('PulseShowcaseAnimation', () => {
  it('inlines the vendored COMP_0001 trajectory with its accessible name', () => {
    const html = renderToStaticMarkup(<PulseShowcaseAnimation />);
    expect(html).toContain('data-showcase="pulse-animation"');
    expect(html).toContain('id="pulse-observed"');
    expect(html).toContain('id="pulse-band"');
    expect(html).toContain(PULSE_SHOWCASE_ANIMATED_LABEL);
    expect(html).toContain('@keyframes pulse-draw');
    expect(html).not.toContain('<script');
  });
});

describe('PULSE_SHOWCASE_ANIMATED_SVG', () => {
  it('matches the public asset and freezes under reduced motion', () => {
    const publicPath = resolve(
      process.cwd(),
      'public/landing/pulse-trajectory-animated.svg',
    );
    expect(existsSync(publicPath)).toBe(true);
    const fromDisk = readFileSync(publicPath, 'utf8');
    expect(PULSE_SHOWCASE_ANIMATED_SVG).toBe(fromDisk);
    expect(fromDisk).toContain('prefers-reduced-motion');
    expect(fromDisk).toContain('45,6');
    expect(fromDisk).not.toContain('var(--score-');
    expect(fromDisk).not.toContain('<script');

    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('.pulse-showcase-anim *');
    expect(css).toContain('animation: none !important');
  });
});
