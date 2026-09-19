import { describe, expect, it } from 'vitest';

import { EMPTY_ANTICIPATION, parseAnticipation } from '@/lib/xray/anticipation';

const PAYLOAD = {
  lookback_months: 9,
  population_mean_score: 49.82,
  lead_time: {
    n_events: 610,
    n_events_alerted: 472,
    share_events_alerted: 0.7738,
    median_lead_months: 6,
    p25_lead_months: 4,
    p75_lead_months: 8,
    lead_histogram: { '1': 39, '2': 39 },
    detection_rate: { h1: 0.7738, h6: 0.4525 },
    by_alert_type: { score_drop: 111 },
  },
  false_alarms: {
    alerts_evaluated: 6594,
    false_alarms: 5681,
    false_alarm_share: 0.8615,
    per_company_month: 0.22766,
  },
  score_by_months_to_event: [
    { offset: 0, n: 610, mean_score: 31.27 },
    { offset: -3, n: 610, mean_score: 44.03 },
    { bad: true },
  ],
  auroc_oof: {
    h6: { auroc: 0.7789, n: 10270, positives: 3714 },
    h1: { auroc: 0.8554, n: 15966, positives: 2914 },
  },
  definitions_es: { evento: 'Primer mes de un episodio.' },
};

describe('parseAnticipation', () => {
  it('returns an empty block for a missing payload', () => {
    expect(parseAnticipation(undefined)).toEqual(EMPTY_ANTICIPATION);
    expect(parseAnticipation('nope')).toEqual(EMPTY_ANTICIPATION);
  });

  it('parses the lead-time measures', () => {
    const parsed = parseAnticipation(PAYLOAD);
    expect(parsed.leadTime?.medianLeadMonths).toBe(6);
    expect(parsed.leadTime?.detectionRate).toEqual({ h1: 0.7738, h6: 0.4525 });
    expect(parsed.leadTime?.meanLeadMonths).toBeNull();
  });

  it('parses the false-alarm cost', () => {
    expect(parseAnticipation(PAYLOAD).falseAlarms?.falseAlarmShare).toBe(
      0.8615,
    );
  });

  it('orders the event curve by offset and drops malformed points', () => {
    const curve = parseAnticipation(PAYLOAD).scoreCurve;
    expect(curve.map((point) => point.offset)).toEqual([-3, 0]);
  });

  it('orders the AUROC points by horizon', () => {
    const auroc = parseAnticipation(PAYLOAD).aurocOof;
    expect(auroc.map((point) => point.horizon)).toEqual(['h1', 'h6']);
    expect(auroc[0].positives).toBe(2914);
  });

  it('accepts a flat AUROC map', () => {
    const parsed = parseAnticipation({ auroc_oof: { h1: 0.9 } });
    expect(parsed.aurocOof[0]).toMatchObject({
      horizon: 'h1',
      auroc: 0.9,
      n: null,
    });
  });

  it('keeps the Spanish definitions', () => {
    expect(parseAnticipation(PAYLOAD).definitions.evento).toContain('episodio');
  });
});
