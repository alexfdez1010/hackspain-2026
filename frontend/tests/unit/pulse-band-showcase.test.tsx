import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  bandRange,
  PulseBandShowcase,
} from '@/components/layout/pulse-band-showcase';
import { LIGHT_SCORE } from '@/lib/landing/pulse-showcase-svg';
import { SCORE_BANDS } from '@/lib/score';

describe('PulseBandShowcase', () => {
  it('lists the four levels with their colour and opens on the given band', () => {
    const html = renderToStaticMarkup(
      <PulseBandShowcase band="neutral" onBandChange={() => undefined} />,
    );
    expect(html).toContain('aria-label="Niveles del score"');
    for (const band of SCORE_BANDS) {
      expect(html).toContain(`data-band="${band.key}"`);
      expect(html).toContain(band.name);
      expect(html).toContain(`background:${band.color}`);
    }
    expect(html).toMatch(
      /<button[^>]*aria-pressed="true"[^>]*data-band="neutral"|<button[^>]*data-band="neutral"[^>]*aria-pressed="true"/,
    );
    expect(html.split('aria-pressed="false"').length - 1).toBe(3);
    expect(html).toContain(`stroke="${LIGHT_SCORE.neutral}"`);
    expect(html).toContain('flex h-full min-h-0 flex-col gap-5');
  });

  it('prints the range of a band from its legend label', () => {
    expect(bandRange('Frágil (35-50)')).toBe('35-50');
    expect(bandRange('Crítico (<35)')).toBe('<35');
    expect(bandRange('Sólido')).toBe('');
  });
});
