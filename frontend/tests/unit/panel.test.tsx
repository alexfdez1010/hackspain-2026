import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Panel } from '@/components/ui/panel';

describe('Panel', () => {
  it('separates with a hairline on the raised surface, never with a shadow', () => {
    const markup = renderToStaticMarkup(<Panel>Contenido</Panel>);
    expect(markup).toContain('rounded-xl');
    expect(markup).toContain('border-hairline');
    expect(markup).toContain('bg-raised');
    expect(markup).not.toMatch(/shadow/);
    expect(markup).toContain('Contenido');
  });

  it('applies the brand inset by default and hands it over with `none`', () => {
    expect(renderToStaticMarkup(<Panel>x</Panel>)).toContain('p-6');
    expect(renderToStaticMarkup(<Panel padding="none">x</Panel>)).not.toContain(
      'p-6',
    );
  });

  it('keeps the classes of the caller for the layout of the panel', () => {
    const markup = renderToStaticMarkup(
      <Panel className="col-span-2">x</Panel>,
    );
    expect(markup).toContain('col-span-2');
  });
});
