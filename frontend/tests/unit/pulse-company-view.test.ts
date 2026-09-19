import { describe, expect, it } from 'vitest';

import {
  buildContributionItems,
  buildTrajectory,
  buildVariableRows,
  sumContributions,
} from '@/lib/pulse/company-view';
import {
  makeForecastPoint,
  makeSeriesPoint,
  VARIABLE_META,
} from './pulse-fixtures';

const PILLAR_LABELS = { liquidez: 'Liquidez', deuda: 'Deuda y servicio' };

describe('buildTrajectory', () => {
  const series = [
    makeSeriesPoint({ month: '2026-07', pulse: 30 }),
    makeSeriesPoint({ month: '2026-08', pulse: 32.77 }),
  ];
  const forecast = [
    makeForecastPoint({ horizon: 1, targetMonth: '2026-09', pulsePred: 32.47 }),
    makeForecastPoint({ horizon: 6, targetMonth: '2027-02', pulsePred: 31.07 }),
  ];

  it('chains the forecast after the observed months', () => {
    const { points, boundaryIndex } = buildTrajectory(series, forecast);
    expect(points.map((point) => point.month)).toEqual([
      '2026-07',
      '2026-08',
      '2026-09',
      '2027-02',
    ]);
    expect(points.map((point) => point.kind)).toEqual([
      'observed',
      'observed',
      'forecast',
      'forecast',
    ]);
    expect(boundaryIndex).toBe(1);
  });

  it('anchors the band at the last observed score', () => {
    const { points } = buildTrajectory(series, forecast);
    expect(points[0].p10).toBeNull();
    expect(points[1].p10).toBe(32.77);
    expect(points[1].p90).toBe(32.77);
    expect(points[2].p10).toBe(20);
  });

  it('reports no boundary when there is no history', () => {
    expect(buildTrajectory([], forecast).boundaryIndex).toBe(-1);
    expect(buildTrajectory([], []).points).toEqual([]);
  });
});

describe('buildVariableRows', () => {
  it('orders by weight and carries the pillar label', () => {
    const rows = buildVariableRows(
      VARIABLE_META,
      makeSeriesPoint(),
      PILLAR_LABELS,
    );
    expect(rows.map((row) => row.key)).toEqual(['loc_util', 'cash_days']);
    expect(rows[1].pillarLabel).toBe('Liquidez');
    expect(rows[1].score).toBe(38.96);
    expect(rows[1].rawValue).toBe(14.03);
    expect(rows[1].contribution).toBe(5.7);
  });

  it('keeps an unknown variable empty instead of zero', () => {
    const rows = buildVariableRows(
      VARIABLE_META,
      makeSeriesPoint(),
      PILLAR_LABELS,
    );
    const unknown = rows.find((row) => row.key === 'loc_util');
    expect(unknown?.known).toBe(false);
    expect(unknown?.score).toBeNull();
    expect(unknown?.rawValue).toBeNull();
    expect(unknown?.contribution).toBeNull();
  });

  it('renders every variable as unknown when the month is missing', () => {
    const rows = buildVariableRows(VARIABLE_META, null, PILLAR_LABELS);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => !row.known)).toBe(true);
  });

  it('falls back to the pillar key when there is no label', () => {
    const rows = buildVariableRows(VARIABLE_META, null, {});
    expect(rows[0].pillarLabel).toBe('deuda');
  });
});

describe('forecast decomposition', () => {
  it('labels the variables, the context and the model base', () => {
    const items = buildContributionItems(makeForecastPoint(), VARIABLE_META);
    expect(items.map((item) => item.label)).toEqual([
      'Base del modelo',
      'Contexto: flujos, calendario y grupo',
      'Días de caja',
      'Utilización de líneas',
    ]);
  });

  it('orders the bars by absolute impact', () => {
    const items = buildContributionItems(makeForecastPoint(), VARIABLE_META);
    expect(items.map((item) => item.value)).toEqual([-1, -0.6, 0.5, -0.4]);
  });

  it('sums exactly the predicted change of the raw score', () => {
    const point = makeForecastPoint();
    expect(sumContributions(point)).toBeCloseTo(point.deltaRaw ?? 0, 10);
  });
});
