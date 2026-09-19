import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseTrajectoryChart } from '@/components/charts/pulse-trajectory';
import { buildTrajectory } from '@/lib/pulse/company-view';
import { makeForecastPoint, makeSeriesPoint } from './pulse-fixtures';

const SERIES = [
  makeSeriesPoint({ month: '2026-07', pulse: 30 }),
  makeSeriesPoint({ month: '2026-08', pulse: 32.77 }),
];

const FORECAST = [
  makeForecastPoint({
    horizon: 1,
    targetMonth: '2026-09',
    pulsePred: 32.47,
    pulseP10: 19.18,
    pulseP90: 46.85,
  }),
  makeForecastPoint({
    horizon: 6,
    targetMonth: '2027-02',
    pulsePred: 31.07,
    pulseP10: 15.58,
    pulseP90: 48.35,
  }),
];

describe('PulseTrajectoryChart', () => {
  it('draws the observed line, the forecast and a closed band', () => {
    const { points, boundaryIndex } = buildTrajectory(SERIES, FORECAST);
    const markup = renderToStaticMarkup(
      <PulseTrajectoryChart points={points} boundaryIndex={boundaryIndex} />,
    );
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="PULSE mensual desde jul 2026');
    expect(markup).toContain('stroke-dasharray="6 4"');
    expect(markup.match(/Z"/g)).toHaveLength(1);
    expect(markup).not.toContain('NaN');
  });

  it('explains what is missing when there is no history', () => {
    const { points, boundaryIndex } = buildTrajectory([], FORECAST);
    expect(
      renderToStaticMarkup(
        <PulseTrajectoryChart points={points} boundaryIndex={boundaryIndex} />,
      ),
    ).toContain('Sin historial mensual.');
  });
});
