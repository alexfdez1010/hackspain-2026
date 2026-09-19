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
    expect(markup.match(/<a /g)).toHaveLength(6);
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toMatch(/<a[^>]*aria-current="page"[^>]*>Señales</);
    expect(markup).toContain('href="/company/COMP_0001/signals"');
    expect(markup).toContain('href="/method?company=COMP_0001"');
  });

  it('grows the targets to 48 px in the phone menu', () => {
    const row = renderToStaticMarkup(
      <NavSectionLinks sections={SECTIONS} current="pulse" layout="row" />,
    );
    const column = renderToStaticMarkup(
      <NavSectionLinks sections={SECTIONS} current="pulse" layout="column" />,
    );
    expect(row).toContain('min-h-10');
    expect(column).toContain('min-h-12');
    expect(column).toContain('flex-col');
  });
});
