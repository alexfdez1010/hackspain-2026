import { describe, expect, it } from 'vitest';

import { PILLAR_KEYS } from '@/lib/xray/types';
import { StaticJsonSource } from '@/lib/xray/source/static-json';
import {
  deriveCompanyDetail,
  deriveOfferRow,
  selectAlerts,
  selectOffers,
} from '@/lib/xray/source/derive';
import { makeCompany } from './fixtures';

describe('derive helpers', () => {
  it('prices a company from an explicit inflow', () => {
    const row = deriveOfferRow(
      makeCompany({ score: 85, p_stress: 0.05 }),
      50_000,
    );
    expect(row.offer.limit).toBe(50_000);
    expect(row.offer.status).toBe('preaprobada');
  });

  it('prices a company without series as zero', () => {
    expect(deriveOfferRow(makeCompany()).offer.limit).toBe(0);
  });

  it('assembles the company detail', () => {
    const detail = deriveCompanyDetail(makeCompany(), []);
    expect(detail.offerHistory).toEqual([]);
    expect(detail.alerts).toEqual([]);
  });

  it('orders offers by limit and applies the status filter', () => {
    const rows = [
      deriveOfferRow(makeCompany({ company_id: 'A', score: 85 }), 10_000),
      deriveOfferRow(makeCompany({ company_id: 'B', score: 85 }), 90_000),
      deriveOfferRow(makeCompany({ company_id: 'C', score: 10 }), 90_000),
    ];
    expect(selectOffers(rows).map((row) => row.id)).toEqual(['B', 'A', 'C']);
    expect(selectOffers(rows, 'cerrada').map((row) => row.id)).toEqual(['C']);
    expect(selectOffers(rows, undefined, 1)).toHaveLength(1);
  });

  it('filters alerts and returns the newest month first', () => {
    const alerts = [
      {
        company_id: 'A',
        month: '2026-01',
        type: 'score_drop',
        severity: 'warning' as const,
        title_es: '',
        detail_es: '',
        score: null,
        delta: null,
      },
      {
        company_id: 'B',
        month: '2026-05',
        type: 'score_drop',
        severity: 'critical' as const,
        title_es: '',
        detail_es: '',
        score: null,
        delta: null,
      },
      {
        company_id: 'C',
        month: '2026-03',
        type: 'improvement',
        severity: 'info' as const,
        title_es: '',
        detail_es: '',
        score: null,
        delta: null,
      },
    ];
    expect(selectAlerts(alerts).map((alert) => alert.month)).toEqual([
      '2026-05',
      '2026-03',
      '2026-01',
    ]);
    expect(selectAlerts(alerts, 'score_drop')).toHaveLength(2);
    expect(selectAlerts(alerts, undefined, 'critical')).toHaveLength(1);
    expect(selectAlerts(alerts, undefined, undefined, 1)).toHaveLength(1);
  });
});

describe('StaticJsonSource', () => {
  const source = new StaticJsonSource();

  it('loads the bundled dataset', async () => {
    expect(await source.health()).toBe(true);
    const summary = await source.getSummary();
    expect(summary.rows.length).toBeGreaterThan(0);
    expect(summary.histogram).toHaveLength(20);
    expect(summary.worst).toHaveLength(20);
    expect(summary.meta.groupCount).toBeGreaterThan(0);
  });

  it('labels every pillar in Spanish', async () => {
    const meta = await source.getMeta();
    for (const key of PILLAR_KEYS) {
      expect(meta.pillarLabels[key]).toBeTruthy();
    }
  });

  it('loads one company with its series and priced line', async () => {
    const detail = await source.getCompany('COMP_0001');
    expect(detail?.company.series?.length).toBeGreaterThan(0);
    expect(detail?.offerHistory.length).toBeGreaterThan(0);
    expect(detail?.offer.spread_bps).toBeGreaterThanOrEqual(250);
  });

  it('rejects an unsafe company identifier', async () => {
    expect(await source.getCompany('../summary')).toBeNull();
    expect(await source.getCompany('COMP_9999')).toBeNull();
  });

  it('ranks movers in both directions', async () => {
    const movers = await source.getMovers({ limit: 5 });
    expect(movers.improvers).toHaveLength(5);
    expect(movers.decliners).toHaveLength(5);
    expect(movers.improvers[0].delta6m ?? 0).toBeGreaterThan(0);
    expect(movers.decliners[0].delta6m ?? 0).toBeLessThan(0);
  });
});
