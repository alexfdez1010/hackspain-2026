import { describe, expect, it, vi } from 'vitest';

import { parsePulseCompany } from '@/lib/pulse/parse-company';
import { parsePulseSummary } from '@/lib/pulse/parse-summary';
import {
  PULSE_DEMO_COMPANY_ID,
  PULSE_DEMO_CREDIT_LINE_COMPANY_ID,
} from '@/lib/pulse/demo';
import { ApiPulseSource } from '@/lib/pulse/source/api';
import { createPulseDataSource } from '@/lib/pulse/source/factory';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';

/**
 * Builds a `fetch` stub that answers a fixed map of paths.
 *
 * @param routes - Path fragment to JSON body map; unknown paths answer 404.
 * @returns The stub and the list of requested URLs.
 */
function stubFetch(routes: Record<string, unknown>) {
  const calls: string[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const match = Object.keys(routes).find((path) => url.includes(path));
    if (!match) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(routes[match]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('parsePulseSummary', () => {
  it('reads metadata, weights and rows', () => {
    const summary = parsePulseSummary({
      score_name: 'PULSE',
      score_expansion: 'Payment, Underwriting, Liquidity & Solvency Estimate',
      horizons: [1, 6],
      last_month: '2026-08',
      pillars: [{ key: 'liquidez', label: 'Liquidez', weight: 26 }, {}],
      variables: [
        {
          key: 'cash_days',
          number: 1,
          label: 'Días de caja',
          pillar: 'liquidez',
          weight: 12,
          raw: 'cash_days',
          unit: 'días',
        },
      ],
      contribution_keys: ['cash_days', 'contexto', 'base'],
      companies: [
        {
          company_id: 'COMP_0001',
          group_id: 'GROUP_0147',
          months_observed: 8,
          pulse: 32.77,
          pulse_prev: 17.88,
          confidence: 0.82,
          pillars: { liquidez: 34.33 },
          forecast_12m: {
            pulse_pred: 31.07,
            pulse_p10: 15.58,
            pulse_p90: 48.35,
          },
        },
        { group_id: 'GROUP_0002' },
      ],
    });
    expect(summary.meta.horizons).toEqual([1, 6]);
    expect(summary.meta.pillars).toHaveLength(1);
    expect(summary.companies).toHaveLength(1);
    expect(summary.companies[0].forecast12m?.pulsePred).toBe(31.07);
    expect(summary.companies[0].pillars.liquidez).toBe(34.33);
  });

  it('degrades to an empty portfolio instead of throwing', () => {
    expect(parsePulseSummary(null).companies).toEqual([]);
    expect(parsePulseSummary('nope').meta.scoreName).toBe('PULSE');
    expect(parsePulseSummary({}).meta.lastMonth).toBe('');
  });

  it('keeps a missing forecast as null', () => {
    const summary = parsePulseSummary({
      companies: [{ company_id: 'COMP_0001', forecast_12m: null }],
    });
    expect(summary.companies[0].forecast12m).toBeNull();
  });
});

describe('parsePulseCompany', () => {
  it('orders the series by month and the forecast by horizon', () => {
    const company = parsePulseCompany({
      company_id: 'COMP_0001',
      group_id: 'GROUP_0147',
      month: '2026-08',
      pulse: 32.77,
      series: [
        { month: '2026-08', pulse: 32.77, contributions: { cash_days: 5.7 } },
        { month: '2026-07', pulse: 30 },
        { pulse: 1 },
      ],
      forecast: [
        { horizon: 6, target_month: '2027-02', pulse_pred: 31.07 },
        { horizon: 1, target_month: '2026-09', pulse_pred: 32.47 },
      ],
    });
    expect(company?.series.map((point) => point.month)).toEqual([
      '2026-07',
      '2026-08',
    ]);
    expect(company?.forecast.map((point) => point.horizon)).toEqual([1, 6]);
    expect(company?.monthsObserved).toBe(2);
  });

  it('marks a variable as unknown when it carries no score', () => {
    const company = parsePulseCompany({
      company_id: 'COMP_0001',
      series: [
        {
          month: '2026-08',
          variables: {
            cash_days: { score: 38.96, raw: 14.03, known: true },
            loc_util: { score: null, raw: null, known: true },
          },
          contributions: { cash_days: 5.7, broken: 'x' },
        },
      ],
    });
    const point = company?.series[0];
    expect(point?.variables.cash_days.known).toBe(true);
    expect(point?.variables.loc_util.known).toBe(false);
    expect(point?.contributions).toEqual({ cash_days: 5.7 });
  });

  it('rejects a payload without a company identifier', () => {
    expect(parsePulseCompany({ series: [] })).toBeNull();
    expect(parsePulseCompany(null)).toBeNull();
  });
});

describe('createPulseDataSource', () => {
  it('falls back to the bundled JSON files without PULSE_API_URL', () => {
    expect(createPulseDataSource({})).toBeInstanceOf(StaticPulseSource);
    expect(createPulseDataSource({ PULSE_API_URL: '  ' })).toBeInstanceOf(
      StaticPulseSource,
    );
  });

  it('uses the PULSE endpoints when PULSE_API_URL is set', async () => {
    const { impl, calls } = stubFetch({
      '/api/pulse/summary': { companies: [{ company_id: 'COMP_0001' }] },
      '/api/pulse/companies/COMP_0001': { company_id: 'COMP_0001' },
    });
    const source = createPulseDataSource(
      { PULSE_API_URL: 'http://localhost:8000/' },
      impl,
    );
    expect(source).toBeInstanceOf(ApiPulseSource);
    expect((await source.getSummary()).companies).toHaveLength(1);
    expect((await source.getCompany('COMP_0001'))?.companyId).toBe('COMP_0001');
    expect(calls).toEqual([
      'http://localhost:8000/api/pulse/summary',
      'http://localhost:8000/api/pulse/companies/COMP_0001',
    ]);
  });

  it('degrades to an empty portfolio when the service is down', async () => {
    const source = createPulseDataSource(
      { PULSE_API_URL: 'http://localhost:8000' },
      stubFetch({}).impl,
    );
    expect((await source.getSummary()).companies).toEqual([]);
    expect(await source.getCompany('COMP_0001')).toBeNull();
  });
});

describe('StaticPulseSource', () => {
  const source = new StaticPulseSource();

  it('reads the bundled export with its published weights', async () => {
    const { meta, companies } = await source.getSummary();
    expect(companies.length).toBeGreaterThan(1_000);
    expect(meta.variables).toHaveLength(11);
    expect(
      meta.variables.reduce((total, variable) => total + variable.weight, 0),
    ).toBe(100);
    expect(
      meta.pillars.reduce((total, pillar) => total + pillar.weight, 0),
    ).toBe(100);
    expect(meta.evaluation.score.auroc).toBeGreaterThan(0.5);
    expect(meta.evaluation.forecast.map((item) => item.horizon)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(meta.evaluation.risk.auroc).toBeGreaterThan(0.5);
  });

  it('reads the demo companies of the navigation', async () => {
    const company = await source.getCompany(PULSE_DEMO_COMPANY_ID);
    expect(company?.series.length).toBeGreaterThan(0);
    expect(company?.forecast.map((point) => point.horizon)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    const withLines = await source.getCompany(
      PULSE_DEMO_CREDIT_LINE_COMPANY_ID,
    );
    const last = withLines?.series[withLines.series.length - 1];
    expect(last?.variables.loc_util.known).toBe(true);
  });

  it('refuses an unsafe identifier and answers null for an unknown one', async () => {
    expect(await source.getCompany('../summary')).toBeNull();
    expect(await source.getCompany('COMP_9999')).toBeNull();
  });
});
