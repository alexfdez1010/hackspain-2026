import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import NotFound, { metadata } from '@/app/not-found';
import { PRODUCT_SECTIONS } from '@/lib/landing/product-sections';

describe('NotFound', () => {
  it('names the state once and links every product surface of the demo', () => {
    const markup = renderToStaticMarkup(<NotFound />);
    expect(markup).toContain('Error 404');
    expect(markup).toMatch(/<h1[^>]*>Esta página no existe<\/h1>/);
    for (const section of PRODUCT_SECTIONS) {
      expect(markup).toContain(`href="${section.href}"`);
      expect(markup).toContain(`>${section.label}<`);
    }
    expect(markup.match(/<h1/g)).toHaveLength(1);
  });

  it('titles the document as not found', () => {
    expect(metadata.title).toBe('Página no encontrada · Embat Pulse');
  });
});
