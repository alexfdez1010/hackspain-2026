import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import {
  TrajectoryHover,
  TrajectoryTooltip,
} from '@/components/charts/trajectory-tooltip';
import { buildTrajectory } from '@/lib/pulse/company-view';
import { labelStep, layoutTrajectory } from '@/lib/pulse/trajectory-layout';
import { makeForecastPoint, makeSeriesPoint } from './pulse-fixtures';

const BOX = {
  width: 1000,
  height: 288,
  padLeft: 28,
  padRight: 34,
  padTop: 22,
  padBottom: 28,
};

const { points, boundaryIndex } = buildTrajectory(
  [
    makeSeriesPoint({ month: '2026-06', pulse: null }),
    makeSeriesPoint({ month: '2026-07', pulse: 30 }),
    makeSeriesPoint({ month: '2026-08', pulse: 32.77 }),
  ],
  [
    makeForecastPoint({
      horizon: 1,
      targetMonth: '2026-09',
      pulsePred: 32.47,
      pulseP10: 19.18,
      pulseP90: 46.85,
    }),
  ],
);

describe('layoutTrajectory', () => {
  it('spreads the months across the measured width', () => {
    const layout = layoutTrajectory(points, boundaryIndex, BOX);
    expect(layout.placed[0].x).toBe(BOX.padLeft);
    expect(layout.placed[3].x).toBe(BOX.width - BOX.padRight);
    expect(layout.placed[0].y).toBeNull();
    expect(layout.observed.map((point) => point.month)).toEqual([
      '2026-07',
      '2026-08',
    ]);
    expect(layout.projected.map((point) => point.month)).toEqual([
      '2026-08',
      '2026-09',
    ]);
    expect(layout.band).toMatch(/Z$/);
    expect(layout.labelStep).toBe(1);
  });

  it('labels fewer months when the plot is narrow', () => {
    expect(labelStep(24, 1200)).toBe(1);
    expect(labelStep(24, 300)).toBe(4);
    expect(labelStep(3, 40)).toBe(3);
  });
});

describe('the trajectory tooltip', () => {
  const layout = layoutTrajectory(points, boundaryIndex, BOX);

  it('names the month, the value and the band in the inverted colours', () => {
    const markup = renderToStaticMarkup(
      <TrajectoryTooltip point={layout.placed[2]} box={BOX} />,
    );
    expect(markup).toContain('bg-foreground');
    expect(markup).toContain('text-background');
    expect(markup).toContain('ago 2026');
    expect(markup).toContain('32,8');
    expect(markup).toContain('Crítico (&lt;35)');
    expect(markup).not.toContain('previsto');
  });

  it('marks a forecast month and prints its band', () => {
    const markup = renderToStaticMarkup(
      <TrajectoryTooltip point={layout.placed[3]} box={BOX} />,
    );
    expect(markup).toContain('previsto');
    expect(markup).toContain('19,2-46,9');
    expect(markup).toContain(`width:${176}px`);
    expect(markup).toContain(`left:${BOX.width - 176}px`);
  });

  it('renders nothing for a month without score', () => {
    expect(
      renderToStaticMarkup(
        <TrajectoryTooltip point={layout.placed[0]} box={BOX} />,
      ),
    ).toBe('');
  });

  it('exposes every month to the keyboard with its value', () => {
    const markup = renderToStaticMarkup(
      <svg>
        <TrajectoryHover
          placed={layout.placed}
          activeIndex={2}
          box={BOX}
          onHover={() => {}}
          onLeave={() => {}}
        />
      </svg>,
    );
    expect(markup).toContain('aria-label="jun 2026: sin score"');
    expect(markup).toContain('aria-label="ago 2026: 32,8"');
    expect(markup).toContain('aria-label="sep 2026: 32,5 previsto"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('r="5.5"');
  });
});
