import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { NavSectionLinks } from '@/components/layout/nav-section-links';
import { companySections } from '@/components/layout/site-nav';

const SECTIONS = companySections('COMP_0001');

describe('NavSectionLinks', () => {
  it('marks the current section and links every other one', () => {
    const markup = renderToStaticMarkup(
      <NavSectionLinks sections={SECTIONS} current="signals" layout="row" />,
    );
    expect(markup.match(/<a /g)).toHaveLength(7);
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toMatch(/<a[^>]*aria-current="page"[^>]*>Alertas</);
    expect(markup).toContain('href="/company/COMP_0001/signals"');
    expect(markup).toContain('href="/company/COMP_0001/action"');
    expect(markup).toContain('href="/method?company=COMP_0001"');
  });

  it('draws the wide row as tabs on a rule and grows the phone targets to 48 px', () => {
    const row = renderToStaticMarkup(
      <NavSectionLinks sections={SECTIONS} current="pulse" layout="row" />,
    );
    const column = renderToStaticMarkup(
      <NavSectionLinks sections={SECTIONS} current="pulse" layout="column" />,
    );
    expect(row).toContain('border-b-2');
    expect(row).toMatch(
      /<a[^>]*aria-current="page"[^>]*border-accent text-ink/,
    );
    expect(row.split('border-transparent').length - 1).toBe(6);
    expect(row).not.toContain('bg-brand-subtle');
    expect(column).toContain('min-h-12');
    expect(column).toContain('flex-col');
    expect(column).toContain('bg-brand-subtle');
  });
});
