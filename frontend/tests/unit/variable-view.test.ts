import { describe, expect, it } from 'vitest';

import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import { buildVariableForecast } from '@/lib/pulse/variable-forecast';
import { buildVariableStanding } from '@/lib/pulse/variable-peers';
import {
  buildVariablePoints,
  buildVariableStats,
} from '@/lib/pulse/variable-series';
import {
  buildVariableView,
  findVariable,
  orderedVariables,
} from '@/lib/pulse/variable-view';
import { makeForecastPoint, makeSeriesPoint } from './pulse-fixtures';

const source = new StaticPulseSource();
const summary = await source.getSummary();
const company = (await source.getCompany('COMP_0001'))!;

describe('buildVariablePoints', () => {
  it('reads the variable of every month and measures the change against the previous month with data', () => {
    const series = [
      makeSeriesPoint({
        month: '2026-06',
        variables: { cash_days: { score: 30, raw: 10, known: true } },
        contributions: { cash_days: 3.6 },
      }),
      makeSeriesPoint({
        month: '2026-07',
        variables: { cash_days: { score: null, raw: null, known: false } },
        contributions: { cash_days: 0 },
      }),
      makeSeriesPoint({
        month: '2026-08',
        variables: { cash_days: { score: 45, raw: 16, known: true } },
        contributions: { cash_days: 5.4 },
        pillars: { liquidez: 44 },
        pulse: 41,
      }),
    ];
    const points = buildVariablePoints(series, 'cash_days', 'liquidez');
    expect(points.map((point) => point.score)).toEqual([30, null, 45]);
    expect(points[0].change).toBeNull();
    expect(points[1].known).toBe(false);
    expect(points[1].contribution).toBeNull();
    expect(points[2].change).toBe(15);
    expect(points[2].pillarScore).toBe(44);
    expect(points[2].pulse).toBe(41);
    expect(points[2].contribution).toBe(5.4);
  });

  it('treats a known flag without score as unknown', () => {
    const points = buildVariablePoints(
      [
        makeSeriesPoint({
          variables: { cash_days: { score: null, raw: 3, known: true } },
        }),
      ],
      'cash_days',
      'liquidez',
    );
    expect(points[0].known).toBe(false);
    expect(points[0].raw).toBeNull();
  });
});

describe('buildVariableStats', () => {
  it('summarises the months with data', () => {
    const points = buildVariablePoints(company.series, 'cash_days', 'liquidez');
    const stats = buildVariableStats(points);
    expect(stats.total).toBe(8);
    expect(stats.known).toBe(8);
    expect(stats.mean).not.toBeNull();
    expect(stats.best!.score).toBeGreaterThanOrEqual(stats.worst!.score);
    expect(stats.trend).toBeCloseTo(points[7].score! - points[0].score!, 5);
    expect(stats.largestMove).not.toBeNull();
  });

  it('returns nulls for a variable that never had data', () => {
    const points = buildVariablePoints(company.series, 'loc_util', 'deuda');
    const stats = buildVariableStats(points);
    expect(stats.known).toBe(0);
    expect(stats.mean).toBeNull();
    expect(stats.best).toBeNull();
    expect(stats.trend).toBeNull();
    expect(stats.rawMean).toBeNull();
    expect(stats.meanContribution).toBeNull();
  });
});

describe('buildVariableForecast', () => {
  it('reads the contribution of the variable at every horizon and ranks it', () => {
    const forecast = buildVariableForecast(company.forecast, 'cash_min');
    expect(forecast.impacts).toHaveLength(6);
    expect(forecast.impacts[0].horizon).toBe(1);
    expect(forecast.impacts[0].points).toBeCloseTo(1.42);
    expect(forecast.farthest?.horizon).toBe(6);
    expect(forecast.peak).not.toBeNull();
    expect(forecast.driverCount).toBe(13);
    expect(forecast.rankAtFarthest).toBeGreaterThanOrEqual(1);
    expect(forecast.rankAtFarthest).toBeLessThanOrEqual(13);
  });

  it('keeps nulls for a driver the model did not publish', () => {
    const forecast = buildVariableForecast(
      [makeForecastPoint({ contributions: { contexto: -0.6, base: -1 } })],
      'cash_days',
    );
    expect(forecast.impacts[0].points).toBeNull();
    expect(forecast.peak).toBeNull();
    expect(forecast.rankAtFarthest).toBeNull();
  });

  it('is empty without a forecast', () => {
    const forecast = buildVariableForecast([], 'cash_days');
    expect(forecast.impacts).toEqual([]);
    expect(forecast.farthest).toBeNull();
  });
});

describe('buildVariableStanding', () => {
  it('ranks the known variables and sinks the unknown ones', () => {
    const last = company.series[company.series.length - 1];
    const standing = buildVariableStanding(
      summary.meta.variables,
      summary.meta.pillars,
      last,
      'ar90',
    );
    expect(standing.peers).toHaveLength(11);
    expect(standing.knownCount).toBe(9);
    expect(standing.peers[0].key).toBe('ar90');
    expect(standing.rankByScore).toBe(1);
    expect(standing.rankByContribution).toBe(1);
    expect(standing.peers.slice(-2).every((peer) => !peer.known)).toBe(true);
    expect(standing.peers.filter((peer) => peer.current)).toHaveLength(1);
    expect(standing.peers[0].pillarLabel).toBe('Calidad de cobro');
  });

  it('gives no rank to an unknown variable', () => {
    const last = company.series[company.series.length - 1];
    const standing = buildVariableStanding(
      summary.meta.variables,
      summary.meta.pillars,
      last,
      'loc_util',
    );
    expect(standing.rankByScore).toBeNull();
    expect(standing.rankByContribution).toBeNull();
  });
});

describe('buildVariableView', () => {
  it('assembles the page of a variable with its neighbours', () => {
    const variable = findVariable(summary.meta, 'cash_min')!;
    const view = buildVariableView(company, summary.meta, variable)!;
    expect(view.pillar.key).toBe('liquidez');
    expect(view.shareOfPillar).toBeCloseTo(14 / 26);
    expect(view.doc?.better).toBe('alto');
    expect(view.last?.month).toBe('2026-08');
    expect(view.last?.score).toBeCloseTo(30.37);
    expect(view.previous?.key).toBe('cash_days');
    expect(view.next?.key).toBe('loc_util');
    expect(view.points).toHaveLength(8);
  });

  it('has no neighbour past the ends of the specification', () => {
    const ordered = orderedVariables(summary.meta.variables);
    const first = buildVariableView(company, summary.meta, ordered[0])!;
    const last = buildVariableView(
      company,
      summary.meta,
      ordered[ordered.length - 1],
    )!;
    expect(first.previous).toBeNull();
    expect(first.next?.key).toBe(ordered[1].key);
    expect(last.next).toBeNull();
    expect(last.variable.key).toBe('network');
  });

  it('rejects a variable whose pillar is not published', () => {
    const variable = { ...findVariable(summary.meta, 'dso')!, pillar: 'nope' };
    expect(buildVariableView(company, summary.meta, variable)).toBeNull();
    expect(findVariable(summary.meta, 'missing')).toBeNull();
  });
});
