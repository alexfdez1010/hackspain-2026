import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PillarShift } from '@/components/advisor/pillar-shift';

describe('PillarShift', () => {
  it('names both ends of the move with their bands', () => {
    const markup = renderToStaticMarkup(
      <PillarShift current={34.3} target={60} label="Pilar liquidez" />,
    );
    expect(markup).toContain(
      'aria-label="Pilar liquidez: de 34, Crítico (&lt;35), a 60, Neutro (50-65)"',
    );
    expect(markup).toContain('hoy · Crítico (&lt;35)');
    expect(markup).toContain('objetivo · Neutro (50-65)');
    expect(markup).toContain('left:34.3%;width:25.7');
    expect(markup).toContain('var(--score-critical)');
    expect(markup).toContain('var(--score-neutral)');
  });

  it('draws a zero-width stretch when there is nothing to move', () => {
    const markup = renderToStaticMarkup(
      <PillarShift current={null} target={null} label="Pilar" />,
    );
    expect(markup).toContain('width:0%');
    expect(markup).not.toContain('NaN');
  });
});
