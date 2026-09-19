import { describe, expect, it } from 'vitest';

import type {
  ActionContext,
  ActionOffer,
  ActionVariable,
} from '@/lib/actions/context';
import { fallbackActions } from '@/lib/actions/fallback';

/** The first offer of a company that can borrow, with its best lever. */
const OFFER: ActionOffer = {
  label: 'Línea de crédito',
  headline: 'Cubre 0,60 meses de pagos operativos.',
  amount: 45000,
  tenorMonths: 12,
  annualRate: 0.0917,
  monthlyInstalment: null,
  why: ['Los días de caja están en 14,0 días.'],
  bestLever: {
    pillar: 'liquidez',
    label: 'Pilar liquidez',
    current: 34,
    target: 55,
    pStressNow: 0.28,
    pStressThen: 0.07,
    premiumSavingBps: 395,
    variables: [{ key: 'cash_days', label: 'Días de caja', score: 21 }],
  },
};

/** The heaviest variable of the close without a reading. */
const UNKNOWN: ActionVariable = {
  key: 'dso',
  label: 'Días de cobro',
  score: null,
  raw: null,
  unit: 'días',
  weight: 14,
  pillar: 'cobro',
};

/**
 * Builds a context with nothing to do, so each case adds only what it tests.
 *
 * @param overrides - Fields of the context to replace.
 * @returns The context the deterministic writer reads.
 */
function makeContext(overrides: Partial<ActionContext> = {}): ActionContext {
  return {
    companyId: 'COMP_0001',
    name: 'Atresmedia Labs',
    month: '2026-08',
    pulse: 45.6,
    band: 'Frágil',
    change: -1.8,
    confidence: 0.82,
    pillars: { liquidez: 34, deuda: 52, cobro: 61, pago: 70 },
    weakestVariables: [],
    unknownVariables: [],
    forecast6m: null,
    signal: null,
    pStress6m: 0.28,
    cash: { cashEnd: 156000, monthlyOutflow: 79094 },
    offers: [],
    declined: [],
    unlocks: [],
    ...overrides,
  };
}

describe('fallbackActions', () => {
  it('writes three actions and drops the fourth candidate', () => {
    const actions = fallbackActions(
      makeContext({
        offers: [OFFER],
        signal: {
          kind: 'caida',
          headline: 'Caída de 6,2 puntos',
          detail: 'El PULSE bajó 6,2 puntos y la bajada dura tres meses.',
          pPersistent: 0.74,
        },
        unknownVariables: [UNKNOWN],
      }),
    );
    expect(actions).toHaveLength(3);
    expect(actions[0].title).toContain('Contrata línea de crédito de 45.000');
    expect(actions[0].title).toContain('a 12 meses');
    expect(actions[0].target).toBe('advisor');
    expect(actions[1].title).toContain('caída');
    expect(actions[1].target).toBe('signals');
    expect(actions[2].title).toContain('Días de caja'.toLowerCase());
    expect(actions[2].target).toBe('variable:cash_days');
    expect(actions.map((action) => action.title).join(' ')).not.toContain(
      'días de cobro',
    );
  });

  it('ignores a signal that is good news', () => {
    const actions = fallbackActions(
      makeContext({
        offers: [OFFER],
        signal: {
          kind: 'mejora',
          headline: 'Mejora de 4,0 puntos',
          detail: 'El PULSE subió y la subida dura.',
          pPersistent: 0.8,
        },
      }),
    );
    expect(actions.map((action) => action.target)).toEqual([
      'advisor',
      'variable:cash_days',
    ]);
  });

  it('leads with the unlock when no product is on the table', () => {
    const actions = fallbackActions(
      makeContext({
        unlocks: ['Préstamo a plazo: se desbloquea con un PULSE de 55'],
        unknownVariables: [UNKNOWN],
      }),
    );
    expect(actions).toHaveLength(2);
    expect(actions[0].title).toBe('Préstamo a plazo: llega a un PULSE de 55');
    expect(actions[0].target).toBe('advisor');
    expect(actions[1].title).toContain('días de cobro');
    expect(actions[1].target).toBe('variable:dso');
  });

  it('says nothing when nothing changes the situation', () => {
    expect(fallbackActions(makeContext())).toEqual([]);
  });
});
