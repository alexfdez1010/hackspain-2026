import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiteFrame } from '@/components/layout/site-frame';

describe('SiteFrame', () => {
  it('keeps the overlay presentational and paints the pulse on the right line', () => {
    const html = renderToStaticMarkup(
      <SiteFrame split pulse>
        <span>content</span>
      </SiteFrame>,
    );
    expect(html).toContain('aria-hidden');
    expect(html).toContain('gutter-pulse');
    expect(html).toContain('right-[var(--site-gutter)]');
  });

  it('omits the traveling tick when pulse is off', () => {
    const html = renderToStaticMarkup(
      <SiteFrame>
        <span>content</span>
      </SiteFrame>,
    );
    expect(html).toContain('aria-hidden');
    expect(html).not.toContain('gutter-pulse');
  });
});
