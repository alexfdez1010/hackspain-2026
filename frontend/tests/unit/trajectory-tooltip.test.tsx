import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { TrajectoryTooltip } from '@/components/charts/trajectory-tooltip';
import type { ChartBox } from '@/components/charts/geometry';
import type { PlacedTrajectoryPoint } from '@/lib/pulse/trajectory-layout';
import { makeSignal } from './pulse-fixtures';

const BOX: ChartBox = {
  width: 800,
  height: 240,
  padTop: 20,
  padBottom: 24,
  padLeft: 28,
  padRight: 12,
};

const POINT: PlacedTrajectoryPoint = {
  index: 3,
  month: '2026-04',
  value: 46.9,
  p10: null,
  p90: null,
  kind: 'observed',
  x: 300,
  y: 120,
};

describe('TrajectoryTooltip', () => {
  it('names the month, the score and its band', () => {
    const markup = renderToStaticMarkup(
      <TrajectoryTooltip point={POINT} box={BOX} />,
    );
    expect(markup).toContain('abr 2026');
    expect(markup).toContain('46,9');
    expect(markup).toContain('Frágil');
    expect(markup).toContain('width:176px');
    expect(markup).not.toContain('Caída');
  });

  it('widens and explains the signal of a flagged month', () => {
    const signal = makeSignal({
      headline: 'Caída de 7 puntos en abril de 2026',
      detail: 'PULSE bajó de 54 a 47; se movieron liquidez (-10).',
    });
    const markup = renderToStaticMarkup(
      <TrajectoryTooltip point={POINT} box={BOX} signal={signal} />,
    );
    expect(markup).toContain('width:288px');
    expect(markup).toContain('Caída');
    expect(markup).toContain('var(--score-critical)');
    expect(markup).toContain('Caída de 7 puntos en abril de 2026');
    expect(markup).toContain('se movieron liquidez (-10)');
  });
});
