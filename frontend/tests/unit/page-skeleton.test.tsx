import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CompanyLoading from '@/app/(app)/company/[id]/loading';
import MethodLoading from '@/app/(app)/method/loading';
import { PageSkeleton } from '@/components/layout/page-skeleton';

describe('PageSkeleton', () => {
  const markup = renderToStaticMarkup(<PageSkeleton />);

  it('announces the load and shows nothing else as text', () => {
    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain('Cargando la página');
    expect(markup.replace(/<[^>]+>/g, '').trim()).toBe('Cargando la página…');
  });

  it('keeps the rhythm of the page shell and the KPI strip', () => {
    expect(markup).toContain('max-w-[1240px]');
    expect(markup).toContain('gap-12');
    expect(markup.match(/border-t border-l border-hairline/g)).toHaveLength(4);
    expect(markup).toContain('motion-safe:animate-pulse');
    expect(markup).not.toMatch(/[\s"]animate-pulse/);
  });

  it('is what the company and method routes stream while loading', () => {
    expect(renderToStaticMarkup(<CompanyLoading />)).toBe(markup);
    expect(renderToStaticMarkup(<MethodLoading />)).toBe(markup);
  });
});
