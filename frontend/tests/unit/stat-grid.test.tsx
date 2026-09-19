import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { StatItem } from '@/components/ui/stat-grid';
import { StatGrid } from '@/components/ui/stat-grid';

const ITEMS: readonly StatItem[] = [
  { key: 'pulse', label: 'PULSE', value: '61,4', hint: 'cierre de mayo' },
  { key: 'delta', label: 'Variación', value: '+1,2' },
  { key: 'conf', label: 'Confianza', value: '84 %' },
  { key: 'caja', label: 'Días de caja', value: '47' },
];

describe('StatGrid', () => {
  it('renders one bordered strip, not four loose figures', () => {
    const markup = renderToStaticMarkup(<StatGrid items={ITEMS} />);
    expect(markup).toContain('rounded-xl');
    expect(markup).toContain('border-hairline');
    expect(markup).toContain('bg-raised');
    expect(markup).toContain('overflow-hidden');
  });

  it('separates every cell with a hairline and clips the outer ones', () => {
    const markup = renderToStaticMarkup(<StatGrid items={ITEMS} />);
    expect(markup.match(/border-l/g)).toHaveLength(ITEMS.length);
    expect(markup.match(/border-t/g)).toHaveLength(ITEMS.length);
    expect(markup).toContain('-ml-px -mt-px');
  });

  it('shows the value above its label, with the hint below', () => {
    const markup = renderToStaticMarkup(<StatGrid items={ITEMS} />);
    expect(markup).toContain('text-[32px]');
    expect(markup).toContain('tabular-nums');
    expect(markup).toContain('order-1');
    expect(markup).toContain('order-2');
    expect(markup).toContain('order-3');
    expect(markup).toContain('61,4');
    expect(markup).toContain('cierre de mayo');
  });

  it('omits the hint when the figure carries no qualifier', () => {
    const markup = renderToStaticMarkup(<StatGrid items={[ITEMS[1]]} />);
    expect(markup).not.toContain('text-[13px]');
  });

  it('takes the column count of the caller on wide screens', () => {
    expect(
      renderToStaticMarkup(<StatGrid items={ITEMS} columns={3} />),
    ).toContain('sm:grid-cols-3');
    expect(renderToStaticMarkup(<StatGrid items={ITEMS} />)).toContain(
      'lg:grid-cols-4',
    );
  });
});
