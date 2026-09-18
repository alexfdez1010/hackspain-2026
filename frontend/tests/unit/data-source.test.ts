import { describe, expect, it, vi } from 'vitest';

import { ApiSource } from '@/lib/xray/source/api';
import { buildQuery, unwrapList } from '@/lib/xray/source/api-mappers';
import { createDataSource } from '@/lib/xray/source/factory';
import { StaticJsonSource } from '@/lib/xray/source/static-json';

/**
 * Builds a `fetch` stub that answers a fixed map of paths.
 *
 * @param routes - Path to JSON body map; unknown paths answer 404.
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

describe('createDataSource', () => {
  it('falls back to the bundled JSON files without XRAY_API_URL', () => {
    expect(createDataSource({})).toBeInstanceOf(StaticJsonSource);
    expect(createDataSource({ XRAY_API_URL: '' })).toBeInstanceOf(
      StaticJsonSource,
    );
    expect(createDataSource({ XRAY_API_URL: '   ' })).toBeInstanceOf(
      StaticJsonSource,
    );
  });

  it('uses the API when XRAY_API_URL is set', () => {
    const source = createDataSource({ XRAY_API_URL: 'http://localhost:8000' });
    expect(source).toBeInstanceOf(ApiSource);
    expect(source.kind).toBe('api');
  });
});

describe('api mappers', () => {
  it('unwraps both bare arrays and envelopes', () => {
    expect(unwrapList([1, 2])).toEqual([1, 2]);
    expect(unwrapList({ items: [1] })).toEqual([1]);
    expect(unwrapList({ companies: [1, 2] })).toEqual([1, 2]);
    expect(unwrapList({ nothing: 1 })).toEqual([]);
  });

  it('drops empty and neutral query parameters', () => {
    expect(
      buildQuery({ limit: 10, status: undefined, type: 'all', q: '' }),
    ).toBe('?limit=10');
    expect(buildQuery({})).toBe('');
  });
});

describe('ApiSource', () => {
  it('reads the meta endpoint', async () => {
    const { impl, calls } = stubFetch({
      '/api/meta': {
        generated_for: 'Embat X-Ray',
        pillar_labels: { liquidity: 'Liquidez' },
        feature_labels: { dso_days: 'DSO' },
        feature_pillars: { dso_days: 'receivables' },
        n_companies: 1286,
        n_groups: 250,
      },
    });
    const source = new ApiSource('http://api.test/', impl);
    const meta = await source.getMeta();
    expect(meta.companyCount).toBe(1286);
    expect(meta.groupCount).toBe(250);
    expect(meta.featurePillars.dso_days).toBe('receivables');
    expect(calls[0]).toBe('http://api.test/api/meta');
  });

  it('builds the portfolio from the companies endpoint', async () => {
    const { impl } = stubFetch({
      '/api/meta': { n_companies: 0 },
      '/api/companies': {
        items: [
          { company_id: 'C1', score: 20, score_6m_ago: 50 },
          { company_id: 'C2', score: 80, score_6m_ago: 50 },
        ],
      },
    });
    const summary = await new ApiSource('http://api.test', impl).getSummary();
    expect(summary.rows).toHaveLength(2);
    expect(summary.meta.companyCount).toBe(2);
    expect(summary.stats.medianScore).toBe(50);
  });

  it('returns the company with its alerts and the price given by the service', async () => {
    const { impl } = stubFetch({
      '/api/companies/C1': {
        company: {
          company_id: 'C1',
          score: 70,
          series: [{ month: '2026-01' }],
        },
        alerts: [{ company_id: 'C1', type: 'score_drop' }],
        offer: {
          limit: 123,
          spread_bps: 400,
          status: 'preaprobada',
          multiplier: 0.8,
        },
      },
    });
    const detail = await new ApiSource('http://api.test', impl).getCompany(
      'C1',
    );
    expect(detail?.company.company_id).toBe('C1');
    expect(detail?.alerts).toHaveLength(1);
    expect(detail?.offer.limit).toBe(123);
  });

  it('returns null when the service does not know the company', async () => {
    const { impl } = stubFetch({});
    expect(
      await new ApiSource('http://api.test', impl).getCompany('X'),
    ).toBeNull();
  });

  it('reads the movers endpoint', async () => {
    const { impl, calls } = stubFetch({
      '/api/movers': {
        improvers: [{ company_id: 'UP', score: 80, score_6m_ago: 40 }],
        decliners: [{ company_id: 'DOWN', score: 20, score_6m_ago: 70 }],
      },
    });
    const movers = await new ApiSource('http://api.test', impl).getMovers({
      limit: 5,
    });
    expect(movers.improvers[0].id).toBe('UP');
    expect(movers.decliners[0].delta6m).toBe(-50);
    expect(calls[0]).toContain('window=6&limit=5');
  });

  it('reads alert counts from either shape', async () => {
    const nested = stubFetch({
      '/api/alerts/counts': { counts: { score_drop: 3 } },
    });
    expect(
      await new ApiSource('http://api.test', nested.impl).getAlertCounts(),
    ).toEqual({ score_drop: 3 });
    const flat = stubFetch({ '/api/alerts/counts': { score_drop: 4 } });
    expect(
      await new ApiSource('http://api.test', flat.impl).getAlertCounts(),
    ).toEqual({ score_drop: 4 });
  });

  it('prices offers locally when the service sends none', async () => {
    const { impl } = stubFetch({
      '/api/offers': [
        {
          company_id: 'C1',
          score: 70,
          p_stress: 0.1,
          avg_monthly_inflow: 100_000,
        },
      ],
    });
    const offers = await new ApiSource('http://api.test', impl).getOffers();
    expect(offers[0].offer.limit).toBe(80_000);
    expect(offers[0].offer.status).toBe('preaprobada');
  });

  it('prefers the limit history published by the service', async () => {
    const { impl } = stubFetch({
      '/api/offers/C1': {
        company: {
          company_id: 'C1',
          score: 70,
          series: [{ month: '2026-01' }],
        },
        history: [
          { month: '2026-01', score: 70, limit: 50, status: 'preaprobada' },
        ],
      },
    });
    const detail = await new ApiSource('http://api.test', impl).getOffer('C1');
    expect(detail?.history).toEqual([
      { month: '2026-01', score: 70, limit: 50, status: 'preaprobada' },
    ]);
  });

  it('survives a transport failure', async () => {
    const impl = vi.fn(async () => {
      throw new Error('network down');
    }) as unknown as typeof fetch;
    const source = new ApiSource('http://api.test', impl);
    expect(await source.health()).toBe(false);
    expect(await source.getCompany('C1')).toBeNull();
    expect((await source.getSummary()).rows).toEqual([]);
    expect(await source.getAlerts()).toEqual([]);
  });

  it('reports health when the service answers', async () => {
    const { impl } = stubFetch({ '/health': { status: 'ok' } });
    expect(await new ApiSource('http://api.test', impl).health()).toBe(true);
  });
});
