import { describe, expect, it } from 'vitest';

import { buildPulsePlanView } from '@/lib/pulse/plan-view';
import { FALLBACK_PLAN_KEY, PLANS, planFor } from '@/lib/pulse/plans';
import type { PulseMosaicCell } from '@/lib/pulse/mosaic';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import { scoreBand } from '@/lib/score';

const source = new StaticPulseSource();
const { meta } = await source.getSummary();

/**
 * Builds one cell of a month.
 *
 * @param overrides - Fields to replace.
 * @returns The cell as the mosaic lays it out.
 */
function makeCell(overrides: Partial<PulseMosaicCell> = {}): PulseMosaicCell {
  const score = 'score' in overrides ? (overrides.score ?? null) : 40;
  return {
    key: 'cash_min',
    label: 'Mínimo intramensual de caja',
    pillar: 'liquidez',
    pillarLabel: 'Liquidez',
    weight: 14,
    score,
    known: score !== null,
    band: scoreBand(score),
    rawValue: 8.2,
    unit: 'días',
    contribution: null,
    ...overrides,
  };
}

describe('PLANS', () => {
  it('is keyed by the variable keys of the export', () => {
    const published = new Set(meta.variables.map((variable) => variable.key));
    for (const key of Object.keys(PLANS)) expect(published.has(key)).toBe(true);
    expect(published.has(FALLBACK_PLAN_KEY)).toBe(true);
  });

  it('gives every plan three ordered steps, a cost and a horizon', () => {
    for (const [key, plan] of Object.entries(PLANS)) {
      expect(plan.steps, key).toHaveLength(3);
      expect(plan.title.length, key).toBeGreaterThan(10);
      expect(plan.cost, key).not.toBe('');
      expect(plan.horizon, key).not.toBe('');
    }
  });

  it('falls back to the intramonth minimum for a variable with no plan', () => {
    expect(planFor('loc_util')).toBe(PLANS[FALLBACK_PLAN_KEY]);
    expect(planFor('cash_days').title).toContain('días de caja');
  });

  it('asks the debt calendar for the maturities the model cannot see', () => {
    expect(PLANS.maturities.title).toBe('Conecta tu calendario de deuda');
    expect(PLANS.maturities.steps[0]).toContain('cuadro de amortización');
    expect(PLANS.maturities.cost).toBe('0 €');
    expect(PLANS.maturities.horizon).toBe('Próximo cierre');
  });
});

describe('buildPulsePlanView', () => {
  it('writes the reason from the figures of the month', () => {
    const view = buildPulsePlanView(makeCell(), 82);
    expect(view.points).toBeCloseTo((14 * 60) / 82, 6);
    expect(view.why).toBe(
      'Mínimo intramensual de caja: hoy son 8,2 días. Eso puntúa 40 sobre 100 ' +
        'y la variable pesa 14 de 82 puntos con dato.',
    );
    expect(view.figures.map((figure) => figure.label)).toEqual([
      'Valor real de hoy',
      'Score de hoy, sobre 100',
      'Si la variable llega a 100',
      'Coste de la medida',
      'Cuándo se ve en el PULSE',
    ]);
    expect(view.figures.map((figure) => figure.value)).toEqual([
      '8,2 días',
      '40',
      '+10,24 pts',
      PLANS.cash_min.cost,
      PLANS.cash_min.horizon,
    ]);
  });

  it('puts no points on a variable the month cannot measure', () => {
    const view = buildPulsePlanView(
      makeCell({
        key: 'loc_util',
        label: 'Utilización de líneas',
        score: null,
      }),
      82,
    );
    expect(view.points).toBe(0);
    expect(view.plan).toBe(PLANS[FALLBACK_PLAN_KEY]);
    expect(view.why).toContain('no tiene dato este mes');
    expect(view.figures[0].value).toBe('sin datos');
    expect(view.figures[1].value).toBe('sin datos');
    expect(view.figures[2].value).toBe('+0,00 pts');
  });
});
