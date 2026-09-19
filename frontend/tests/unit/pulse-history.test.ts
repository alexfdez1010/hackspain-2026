import { describe, expect, it } from 'vitest';

import { buildVariableRows } from '@/lib/pulse/company-view';
import { buildForecastRows, buildMonthRows } from '@/lib/pulse/history';
import {
  buildMonthOptions,
  findMonth,
  sortByContribution,
  sumVariableContributions,
} from '@/lib/pulse/month-view';
import { buildPillarSeries } from '@/lib/pulse/pillar-series';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import {
  makeForecastPoint,
  makeSeriesPoint,
  VARIABLE_META,
} from './pulse-fixtures';

const PILLARS = [
  { key: 'cobro', label: 'Calidad de cobro', weight: 36 },
  { key: 'liquidez', label: 'Liquidez', weight: 26 },
  { key: 'deuda', label: 'Deuda y servicio', weight: 26 },
  { key: 'pago', label: 'Comportamiento de pago', weight: 12 },
];

const SERIES = [
  makeSeriesPoint({
    month: '2026-06',
    pulse: 20,
    pillars: { liquidez: 20, deuda: null, cobro: 25, pago: 30 },
  }),
  makeSeriesPoint({ month: '2026-07', pulse: 30 }),
  makeSeriesPoint({ month: '2026-08', pulse: 32.77 }),
];

describe('buildMonthRows', () => {
  it('reads the months backwards but measures the change forwards', () => {
    const rows = buildMonthRows(SERIES);
    expect(rows.map((row) => row.month)).toEqual([
      '2026-08',
      '2026-07',
      '2026-06',
    ]);
    expect(rows[0].change).toBeCloseTo(2.77, 5);
    expect(rows[1].change).toBe(10);
    expect(rows[2].change).toBeNull();
  });

  it('counts the variables the month has no evidence for', () => {
    const rows = buildMonthRows(SERIES);
    expect(rows[0].unknownCount).toBe(1);
    expect(rows[0].cashEnd).toBe(36_982.49);
  });

  it('keeps the change unknown when a score is missing', () => {
    const rows = buildMonthRows([
      makeSeriesPoint({ month: '2026-07', pulse: null }),
      makeSeriesPoint({ month: '2026-08', pulse: 32 }),
    ]);
    expect(rows[0].change).toBeNull();
  });

  it('answers an empty history with no rows', () => {
    expect(buildMonthRows([])).toEqual([]);
  });
});

describe('buildForecastRows', () => {
  it('measures every horizon against the last observed score', () => {
    const rows = buildForecastRows(
      [
        makeForecastPoint({
          horizon: 1,
          targetMonth: '2026-09',
          pulsePred: 32.47,
        }),
        makeForecastPoint({ horizon: 6, pulsePred: 31.07 }),
      ],
      32.77,
    );
    expect(rows.map((row) => row.horizon)).toEqual([1, 6]);
    expect(rows[0].change).toBeCloseTo(-0.3, 5);
    expect(rows[1].change).toBeCloseTo(-1.7, 5);
    expect(rows[1].delta).toBe(-1.5);
  });

  it('keeps the change unknown without a base score', () => {
    expect(buildForecastRows([makeForecastPoint()], null)[0].change).toBeNull();
  });
});

describe('buildMonthOptions and findMonth', () => {
  it('lists the months from the last close backwards', () => {
    expect(buildMonthOptions(SERIES)).toEqual([
      { id: '2026-08', label: 'ago 2026' },
      { id: '2026-07', label: 'jul 2026' },
      { id: '2026-06', label: 'jun 2026' },
    ]);
  });

  it('falls back to the last close for an unknown month', () => {
    expect(findMonth(SERIES, '2026-07')?.month).toBe('2026-07');
    expect(findMonth(SERIES, '1999-01')?.month).toBe('2026-08');
    expect(findMonth([], '2026-08')).toBeNull();
  });
});

describe('sortByContribution', () => {
  const rows = buildVariableRows(VARIABLE_META, SERIES[2], {
    liquidez: 'Liquidez',
    deuda: 'Deuda y servicio',
  });

  it('puts the largest contributor first and the unknown last', () => {
    expect(sortByContribution(rows).map((row) => row.key)).toEqual([
      'cash_days',
      'loc_util',
    ]);
    expect(sortByContribution(rows)[1].known).toBe(false);
  });

  it('adds up only the points backed by data', () => {
    expect(sumVariableContributions(rows)).toBeCloseTo(5.7, 5);
  });
});

describe('buildPillarSeries', () => {
  const series = buildPillarSeries(PILLARS, SERIES);

  it('orders the pillars by the points they own', () => {
    expect(series.map((pillar) => pillar.weight)).toEqual([36, 26, 26, 12]);
    expect(series[0].key).toBe('cobro');
  });

  it('keeps one point per observed month, unknowns included', () => {
    const deuda = series.find((pillar) => pillar.key === 'deuda');
    expect(deuda?.points.map((point) => point.month)).toEqual([
      '2026-06',
      '2026-07',
      '2026-08',
    ]);
    expect(deuda?.points[0].value).toBeNull();
    expect(deuda?.last).toBe(40);
    expect(deuda?.change).toBe(0);
  });

  it('measures the change between the first and the last known month', () => {
    const cobro = series.find((pillar) => pillar.key === 'cobro');
    expect(cobro?.change).toBe(15);
  });

  it('answers an empty history with empty series', () => {
    expect(buildPillarSeries(PILLARS, [])[0].points).toEqual([]);
    expect(buildPillarSeries(PILLARS, [])[0].last).toBeNull();
  });
});

describe('the bundled export feeds the month-by-month view', () => {
  const source = new StaticPulseSource();

  it('builds a row for every observed month of the demo company', async () => {
    const company = await source.getCompany('COMP_0001');
    const rows = buildMonthRows(company?.series ?? []);
    expect(rows).toHaveLength(8);
    expect(rows[0].month).toBe('2026-08');
    expect(rows[rows.length - 1].change).toBeNull();
    expect(rows[0].unknownCount).toBe(2);
  });

  it('builds twenty-four months and four pillars for COMP_0051', async () => {
    const company = await source.getCompany('COMP_0051');
    const { meta } = await source.getSummary();
    expect(buildMonthRows(company?.series ?? [])).toHaveLength(24);
    const pillars = buildPillarSeries(meta.pillars, company?.series ?? []);
    expect(pillars).toHaveLength(4);
    expect(pillars[0].points).toHaveLength(24);
    expect(
      buildForecastRows(company?.forecast ?? [], company?.pulse ?? null),
    ).toHaveLength(6);
  });
});
