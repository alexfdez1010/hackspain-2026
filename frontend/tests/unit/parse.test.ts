import { describe, expect, it } from 'vitest';

import {
  parseCompany,
  parseExplanation,
  parseMonthRecord,
  parseRawKpis,
  parseReasons,
} from '@/lib/xray/parse';
import { parseAlert, parseSummary } from '@/lib/xray/parse-summary';
import {
  toDirection,
  toNumberOrNull,
  toPillars,
  toRegime,
} from '@/lib/xray/parse-primitives';

describe('primitives', () => {
  it('reads numbers from numbers and numeric strings', () => {
    expect(toNumberOrNull(3.5)).toBe(3.5);
    expect(toNumberOrNull('3.5')).toBe(3.5);
    expect(toNumberOrNull('')).toBeNull();
    expect(toNumberOrNull(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toNumberOrNull(null)).toBeNull();
  });

  it('falls back on unknown enums', () => {
    expect(toDirection('improving')).toBe('improving');
    expect(toDirection('sideways')).toBe('stable');
    expect(toRegime('structural_decline')).toBe('structural_decline');
    expect(toRegime(42)).toBe('steady');
  });

  it('always returns the six pillars', () => {
    const pillars = toPillars({ liquidity: 10, unknown: 5 });
    expect(Object.keys(pillars)).toHaveLength(6);
    expect(pillars.liquidity).toBe(10);
    expect(pillars.activity).toBeNull();
  });
});

describe('parseReasons', () => {
  it('keeps well-formed reasons and drops the rest', () => {
    const reasons = parseReasons([
      {
        feature: 'dso_days',
        label: 'DSO',
        pillar: 'receivables',
        impact: -3,
        value: 12,
      },
      'nonsense',
      null,
    ]);
    expect(reasons).toHaveLength(1);
    expect(reasons[0].impact).toBe(-3);
  });

  it('falls back to the feature name when the label is missing', () => {
    expect(parseReasons([{ feature: 'dso_days' }])[0].label).toBe('dso_days');
  });
});

describe('parseRawKpis', () => {
  it('returns every key, null when absent', () => {
    const kpis = parseRawKpis({ inflow: 100 });
    expect(kpis.inflow).toBe(100);
    expect(kpis.loc_utilization).toBeNull();
    expect(Object.keys(kpis)).toHaveLength(17);
  });
});

describe('parseExplanation', () => {
  it('returns undefined when the block is absent or empty', () => {
    expect(parseExplanation(undefined)).toBeUndefined();
    expect(parseExplanation({ waterfall: [] })).toBeUndefined();
  });

  it('parses the waterfall and the narrative', () => {
    const explanation = parseExplanation({
      waterfall: [
        {
          feature: 'cash',
          label: 'Caja',
          delta_points: -8,
          value_before: 1,
          value_after: 0,
        },
        'nonsense',
      ],
      narrative_es: 'El score bajó.',
      regime_text_es: 'Caída estructural.',
    });
    expect(explanation?.waterfall).toHaveLength(1);
    expect(explanation?.narrative_es).toBe('El score bajó.');
  });
});

describe('parseMonthRecord', () => {
  it('requires a month', () => {
    expect(parseMonthRecord({ score: 10 })).toBeNull();
  });

  it('normalises the stress flag', () => {
    expect(
      parseMonthRecord({ month: '2026-01', stress_now: 1 })?.stress_now,
    ).toBe(1);
    expect(
      parseMonthRecord({ month: '2026-01', stress_now: 7 })?.stress_now,
    ).toBe(0);
  });
});

describe('parseCompany', () => {
  it('requires an identifier', () => {
    expect(parseCompany({ score: 10 })).toBeNull();
    expect(parseCompany(null)).toBeNull();
  });

  it('omits the series when the payload carries none', () => {
    const company = parseCompany({ company_id: 'COMP_0001' });
    expect(company?.series).toBeUndefined();
    expect(company?.group_id).toBe('SIN_GRUPO');
  });

  it('parses the series and drops malformed months', () => {
    const company = parseCompany({
      company_id: 'COMP_0001',
      series: [{ month: '2026-01' }, { score: 1 }],
    });
    expect(company?.series).toHaveLength(1);
    expect(company?.months_observed).toBe(1);
  });

  it('ignores unknown extra keys', () => {
    const company = parseCompany({ company_id: 'C', future_field: 123 });
    expect(company).not.toBeNull();
    expect('future_field' in (company as object)).toBe(false);
  });
});

describe('parseAlert', () => {
  it('requires a company and a type', () => {
    expect(parseAlert({ company_id: 'C' })).toBeNull();
    expect(parseAlert({ type: 'score_drop' })).toBeNull();
  });

  it('falls back to an informative severity', () => {
    const alert = parseAlert({ company_id: 'C', type: 'x', severity: 'boom' });
    expect(alert?.severity).toBe('info');
    expect(alert?.title_es).toBe('x');
  });
});

describe('parseSummary', () => {
  it('returns an empty summary for a malformed payload', () => {
    const summary = parseSummary(null);
    expect(summary.companies).toEqual([]);
    expect(summary.alerts).toEqual([]);
    expect(summary.generated_for).toBe('Embat X-Ray');
  });

  it('parses labels, companies and alerts', () => {
    const summary = parseSummary({
      generated_for: 'Embat',
      pillar_labels: { liquidity: 'Liquidez', bad: 3 },
      feature_labels: { dso_days: 'DSO' },
      companies: [{ company_id: 'C1' }, {}],
      alerts: [{ company_id: 'C1', type: 'score_drop' }],
      alert_counts: { score_drop: 1, bad: 'x' },
    });
    expect(summary.companies).toHaveLength(1);
    expect(summary.alerts).toHaveLength(1);
    expect(summary.pillar_labels).toEqual({ liquidity: 'Liquidez' });
    expect(summary.alert_counts).toEqual({ score_drop: 1 });
  });
});
