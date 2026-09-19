import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { HeroAccess } from '@/components/layout/hero-access';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { companyRoutes } from '@/lib/routes';

const demo = companyRoutes(PULSE_DEMO_COMPANY_ID);

describe('HeroAccess', () => {
  it('links the company-scoped product surfaces in a grid, not a folder tab', () => {
    const html = renderToStaticMarkup(<HeroAccess />);
    expect(html).toContain('aria-label="Dashboard"');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('hero-access-link');
    expect(html).toContain('font-normal');
    expect(html).toContain(`href="${demo.pulse}"`);
    expect(html).toContain(`href="${demo.advisor}"`);
    expect(html).toContain(`href="${demo.method}"`);
    expect(html.indexOf('<h1')).toBeGreaterThan(-1);
    expect(html.indexOf('<h1')).toBeLessThan(
      html.indexOf(`href="${demo.pulse}"`),
    );
    expect(html.split('<h1').length - 1).toBe(1);
    expect(html).not.toContain('href="/radar"');
    expect(html).not.toContain('href="/capital"');
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
