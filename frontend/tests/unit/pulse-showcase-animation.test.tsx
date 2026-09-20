import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseShowcaseAnimation } from '@/components/layout/pulse-showcase-animation';
import { bandShowcase } from '@/lib/landing/band-showcase-svg';

describe('PulseShowcaseAnimation', () => {
  it('inlines the band trajectory it is given with its accessible name', () => {
    const showcase = bandShowcase('fragile');
    const html = renderToStaticMarkup(
      <PulseShowcaseAnimation svg={showcase.svg} />,
    );
    expect(html).toContain('data-showcase="pulse-animation"');
    expect(html).toContain('[&amp;_svg]:h-full');
    expect(html).toContain('id="pulse-observed"');
    expect(html).toContain('id="pulse-band"');
    expect(html).toContain('id="pulse-area"');
    expect(html).toContain(showcase.label);
    expect(html).toContain('@keyframes pulse-draw');
    expect(html).toContain('prefers-reduced-motion');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('DM Sans');
  });

  it('freezes under reduced motion through the page stylesheet', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('.pulse-showcase-anim *');
    expect(css).toContain('animation: none !important');
  });
});
