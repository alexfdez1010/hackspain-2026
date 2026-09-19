import { describe, expect, it } from 'vitest';

import { EMPTY_ANTICIPATION, parseAnticipation } from '@/lib/xray/anticipation';
import {
  featurePillarMap,
  groupFeaturesByPillar,
  metricsFromAnticipation,
} from '@/lib/xray/method';
import { makeCompany } from './fixtures';

const COMPANIES = [
  makeCompany({
    reasons: [
      {
        feature: 'dso_days',
        label: 'DSO',
        pillar: 'receivables',
        impact: -3,
        value: 10,
      },
      {
        feature: 'cash_runway_months',
        label: 'Caja',
        pillar: 'liquidity',
        impact: 2,
        value: 1,
      },
    ],
  }),
  makeCompany({
    company_id: 'COMP_0002',
    reasons: [
      {
        feature: 'dso_days',
        label: 'DSO',
        pillar: 'activity',
        impact: 1,
        value: 3,
      },
      {
        feature: 'no_pillar',
        label: 'Sin pilar',
        pillar: '',
        impact: 1,
        value: 0,
      },
    ],
  }),
];

describe('featurePillarMap', () => {
  it('keeps the first pillar seen for each feature', () => {
    const map = featurePillarMap(COMPANIES);
    expect(map.dso_days).toBe('receivables');
    expect(map.cash_runway_months).toBe('liquidity');
  });

  it('ignores reasons without a pillar', () => {
    expect(featurePillarMap(COMPANIES).no_pillar).toBeUndefined();
  });
});

describe('groupFeaturesByPillar', () => {
  it('groups in the canonical pillar order', () => {
    const groups = groupFeaturesByPillar(
      { dso_days: 'DSO', cash_runway_months: 'Caja' },
      featurePillarMap(COMPANIES),
    );
    expect(groups.map((group) => group.pillar)).toEqual([
      'liquidity',
      'receivables',
    ]);
  });

  it('never drops a feature whose pillar is unknown', () => {
    const groups = groupFeaturesByPillar({ mystery: 'Misterio' }, {});
    expect(groups).toEqual([
      {
        pillar: 'otros',
        features: [{ feature: 'mystery', label: 'Misterio' }],
      },
    ]);
  });

  it('returns nothing without features', () => {
    expect(groupFeaturesByPillar({}, {})).toEqual([]);
  });
});

describe('metricsFromAnticipation', () => {
  it('returns nothing when the service published no evidence', () => {
    expect(metricsFromAnticipation(EMPTY_ANTICIPATION)).toEqual([]);
  });

  it('builds one figure per horizon plus the lead time', () => {
    const metrics = metricsFromAnticipation(
      parseAnticipation({
        auroc_oof: { h1: { auroc: 0.8554 }, h6: { auroc: 0.7789 } },
        lead_time: { median_lead_months: 6, n_events: 610 },
      }),
    );
    expect(metrics.map((metric) => metric.label)).toEqual([
      'AUROC a 1 mes',
      'AUROC a 6 meses',
      'Adelanto mediano',
    ]);
    expect(metrics[0].value).toBe('0,855');
  });
});
