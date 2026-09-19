import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { HeroAccess } from '@/components/layout/hero-access';
import { DEMO_COMPANY_ID } from '@/lib/xray/demo';

describe('HeroAccess', () => {
  it('links the four working surfaces in a 2×2 grid, not a folder tab', () => {
    const html = renderToStaticMarkup(<HeroAccess />);
    expect(html).toContain('aria-label="Dashboard"');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('hero-access-link');
    expect(html).toContain('href="/radar"');
    expect(html).toContain('href="/pulse"');
    expect(html).toContain('href="/capital"');
    expect(html).toContain('href="/monitor"');
    expect(html).not.toContain('href="/metodo"');
    expect(html).not.toContain(`href="/empresa/${DEMO_COMPANY_ID}"`);
    expect(html).not.toContain('rounded-t-md');
  });

  it('wipes the underline from left to right, then redraws it in place', () => {
    const css = readFileSync(
      resolve(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(css).toContain('@keyframes hero-underline');
    expect(css).toContain('clip-path: inset(0 0 0 100%)');
    expect(css).toContain('clip-path: inset(0 100% 0 0)');
  });
});
