import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SiteFooter } from '@/components/layout/site-footer';

describe('the product footer', () => {
  const markup = renderToStaticMarkup(<SiteFooter />);

  it('signs the product and says nothing else', () => {
    expect(markup).toContain('By humans for humans.');
    expect(markup).not.toContain('11 variables');
    expect(markup.match(/<span>/g)).toHaveLength(1);
  });

  it('centres the signature over the hairline', () => {
    expect(markup).toContain('justify-center');
    expect(markup).not.toContain('justify-between');
    expect(markup).toContain('border-t');
  });
});
