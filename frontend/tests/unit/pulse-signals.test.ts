import { describe, expect, it } from 'vitest';

import { describeAnticipation } from '@/lib/method/outlook';
import {
  parseSignals,
  parseSignalsEvaluation,
} from '@/lib/pulse/parse-signals';
import { parsePulseCompany } from '@/lib/pulse/parse-company';
import {
  activeSignal,
  describeSignalAge,
  describeSignalStatus,
  monthsBetween,
  signalsByIndex,
} from '@/lib/pulse/signals';
import { buildSignalsView, wasRightCall } from '@/lib/pulse/signals-view';
import { makeSignal } from './pulse-fixtures';

const RAW_SIGNAL = {
  month: '2026-07',
  kind: 'bache',
  direction: 'down',
  level: 38.12,
  baseline: 45.49,
  move: -7.37,
  breadth: 2,
  confidence: 0.82,
  pillar_deltas: { liquidez: -10.24, deuda: null },
  drivers: [{ pillar: 'pago', label: 'comportamiento de pago', delta: -19.3 }],
  p_persistent: 0.39,
  outcome: null,
  headline: 'Bache de 7 puntos en julio de 2026',
  detail: 'PULSE bajó de 45 a 38.',
};

describe('parseSignals', () => {
  it('reads the export contract and sorts oldest first', () => {
    const signals = parseSignals([
      RAW_SIGNAL,
      {
        ...RAW_SIGNAL,
        month: '2026-04',
        kind: 'caida',
        outcome: 'persistente',
      },
    ]);
    expect(signals.map((s) => s.month)).toEqual(['2026-04', '2026-07']);
    expect(signals[1]).toMatchObject({
      kind: 'bache',
      direction: 'down',
      breadth: 2,
      pPersistent: 0.39,
      outcome: null,
      pillarDeltas: { liquidez: -10.24, deuda: null },
    });
    expect(signals[1].drivers[0].label).toBe('comportamiento de pago');
    expect(signals[0].outcome).toBe('persistente');
  });

  it('drops entries without a month or with an unknown kind', () => {
    expect(
      parseSignals([{ kind: 'caida' }, { ...RAW_SIGNAL, kind: 'x' }, 3]),
    ).toEqual([]);
    expect(parseSignals(undefined)).toEqual([]);
  });

  it('is attached to the company by parsePulseCompany', () => {
    const company = parsePulseCompany({
      company_id: 'C1',
      series: [],
      forecast: [],
      signals: [RAW_SIGNAL],
    });
    expect(company?.signals).toHaveLength(1);
    expect(parsePulseCompany({ company_id: 'C1' })?.signals).toEqual([]);
  });
});

describe('parseSignalsEvaluation', () => {
  it('reads the anticipation curve and the persistence figures', () => {
    const evaluation = parseSignalsEvaluation({
      anticipation: {
        horizons: {
          '6': {
            rows: 10,
            base_rate: 0.1,
            auroc: 0.62,
            alert_share: 0.2,
            recall: 0.34,
            precision: 0.18,
            lift: 1.7,
          },
          '1': {
            rows: 20,
            base_rate: 0.02,
            auroc: 0.67,
            alert_share: 0.2,
            recall: 0.43,
            precision: 0.05,
            lift: 2.1,
          },
        },
      },
      persistence: {
        down: { signals: 1858, persistent_share: 0.65, oof_auroc: 0.747 },
      },
    });
    expect(evaluation.anticipation.map((h) => h.horizon)).toEqual([1, 6]);
    expect(evaluation.anticipation[1].recall).toBe(0.34);
    expect(evaluation.persistence.down.auroc).toBe(0.747);
    expect(evaluation.persistence.up.auroc).toBeNull();
    expect(parseSignalsEvaluation(null).anticipation).toEqual([]);
  });

  it('is told in plain words on the method page', () => {
    const sentence = describeAnticipation([
      {
        horizon: 6,
        rows: 10,
        baseRate: 0.1,
        auroc: 0.62,
        alertShare: 0.2,
        recall: 0.34,
        precision: 0.18,
        lift: 1.7,
      },
    ]);
    expect(sentence).toBe(
      'Vigilando solo al 20 % con peor nota se adelanta a 3 de cada 10 tensiones de caja que llegan en los 6 meses siguientes.',
    );
    expect(describeAnticipation([])).toBeNull();
  });
});

describe('signal selectors', () => {
  it('counts months between YYYY-MM strings', () => {
    expect(monthsBetween('2026-04', '2026-08')).toBe(4);
    expect(monthsBetween('2025-11', '2026-02')).toBe(3);
    expect(monthsBetween('2026-08', '2026-04')).toBe(-4);
  });

  it('raises the latest signal only while it is recent', () => {
    const recent = makeSignal({ month: '2026-07', outcome: null });
    expect(
      activeSignal({ month: '2026-08', signals: [makeSignal(), recent] }),
    ).toBe(recent);
    expect(
      activeSignal({
        month: '2026-08',
        signals: [makeSignal({ month: '2026-02' })],
      }),
    ).toBeNull();
    expect(activeSignal({ month: '2026-08', signals: [] })).toBeNull();
    expect(activeSignal({ month: '', signals: [recent] })).toBeNull();
  });

  it('describes age and status without statistics', () => {
    expect(describeSignalAge({ month: '2026-08' }, '2026-08')).toBe('este mes');
    expect(describeSignalAge({ month: '2026-07' }, '2026-08')).toBe(
      'hace 1 mes',
    );
    expect(describeSignalAge({ month: '2026-04' }, '2026-08')).toBe(
      'hace 4 meses',
    );
    expect(describeSignalStatus(makeSignal())).toBe(
      'confirmada tres meses después',
    );
    expect(describeSignalStatus(makeSignal({ outcome: 'transitorio' }))).toBe(
      'se deshizo en menos de tres meses',
    );
    expect(
      describeSignalStatus(makeSignal({ outcome: null, pPersistent: 0.39 })),
    ).toBe('abierta, 39 % de que dure');
    expect(
      describeSignalStatus(makeSignal({ outcome: null, pPersistent: null })),
    ).toBe('abierta');
  });

  it('places signals on the axis by month and skips the rest', () => {
    const placed = signalsByIndex(
      ['2026-03', '2026-04', '2026-05'],
      [makeSignal(), makeSignal({ month: '2027-01' })],
    );
    expect([...placed.keys()]).toEqual([1]);
  });
});

describe('buildSignalsView', () => {
  it('splits open from settled, newest first, and counts the confirmed ones', () => {
    const view = buildSignalsView([
      makeSignal({ month: '2025-10', kind: 'bache', outcome: 'transitorio' }),
      makeSignal({ month: '2026-07', kind: 'bache', outcome: null }),
      makeSignal({ month: '2026-01', kind: 'mejora', direction: 'up' }),
      makeSignal(),
    ]);
    expect(view.open.map((s) => s.month)).toEqual(['2026-07']);
    expect(view.settled.map((s) => s.month)).toEqual([
      '2026-04',
      '2026-01',
      '2025-10',
    ]);
    expect(view.confirmedFalls).toBe(1);
    expect(view.confirmedRises).toBe(1);
    expect(view.rightCalls).toBe(3);
  });

  it('judges the call made the month the signal opened', () => {
    expect(wasRightCall(makeSignal())).toBe(true);
    expect(wasRightCall(makeSignal({ kind: 'bache' }))).toBe(false);
    expect(
      wasRightCall(
        makeSignal({
          kind: 'repunte',
          direction: 'up',
          outcome: 'transitorio',
        }),
      ),
    ).toBe(true);
    expect(wasRightCall(makeSignal({ outcome: null }))).toBe(false);
  });
});
