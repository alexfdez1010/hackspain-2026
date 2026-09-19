import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { HeroAccess } from '@/components/layout/hero-access';
import { companySections } from '@/lib/company/sections';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';

describe('HeroAccess', () => {
  it('links every product page of the demo company in a grid, not a folder tab', () => {
    const html = renderToStaticMarkup(<HeroAccess />);
    expect(html).toContain('aria-label="Dashboard"');
    expect(html).toContain('grid-cols-2');
    expect(html).toContain('hero-access-link');
    expect(html).toContain('font-normal');
    for (const section of companySections(PULSE_DEMO_COMPANY_ID)) {
      expect(html).toContain(`href="${section.href}"`);
      expect(html).toContain(`>${section.label}<`);
    }
    const pulse = companySections(PULSE_DEMO_COMPANY_ID)[0];
    expect(html.indexOf('<h1')).toBeGreaterThan(-1);
    expect(html.indexOf('<h1')).toBeLessThan(
      html.indexOf(`href="${pulse.href}"`),
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
