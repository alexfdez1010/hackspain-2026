import { describe, expect, it } from 'vitest';

import {
  DECLINE_STATUS_LABELS,
  formatReasonValue,
  formatSignedBps,
} from '@/lib/advisor/format';
import {
  buildHoldingRows,
  buildInvoiceRows,
  formatHoldingTypes,
} from '@/lib/advisor/inputs-view';
import {
  buildSizingRows,
  formatSizingInput,
  sizingInputLabel,
} from '@/lib/advisor/sizing-view';
import type { AdvisorLever, AdvisorReason } from '@/lib/advisor/types';
import {
  buildPriceSegments,
  fitPercent,
  formatRiskDriverValue,
  sortLevers,
  sortReasons,
  topLeverPillar,
} from '@/lib/advisor/view';

/**
 * Builds a price component with the fields the bar reads.
 *
 * @param key - Component key.
 * @param bps - Basis points of the component.
 * @returns A component ready for {@link buildPriceSegments}.
 */
function component(key: string, bps: number) {
  return { key, label: key, bps, detail: `detalle de ${key}` };
}

/**
 * Builds a lever with only the fields the ordering reads.
 *
 * @param pillar - Pillar key.
 * @param saving - Premium saving in basis points; `null` when unknown.
 * @returns A lever.
 */
function lever(pillar: string, saving: number | null): AdvisorLever {
  return {
    pillar,
    label: `Pilar ${pillar}`,
    current: 34,
    target: 60,
    pStressNow: 0.28,
    pStressThen: 0.07,
    premiumSavingBps: saving,
    variables: [],
  };
}

describe('buildPriceSegments', () => {
  it('sizes every segment by its weight and keeps the order of the price', () => {
    const segments = buildPriceSegments([
      component('referencia', 210),
      component('margen_producto', 150),
      component('prima_riesgo', 544),
    ]);
    expect(segments.map((segment) => segment.key)).toEqual([
      'referencia',
      'margen_producto',
      'prima_riesgo',
    ]);
    const total = segments.reduce((sum, segment) => sum + segment.share, 0);
    expect(total).toBeCloseTo(100, 6);
    expect(segments[0].offset).toBe(0);
    expect(segments[1].offset).toBeCloseTo(segments[0].share, 6);
    expect(segments[2].share).toBeGreaterThan(segments[0].share);
    expect(segments.every((segment) => !segment.subtractive)).toBe(true);
    expect(segments[0].opacity).toBeGreaterThan(segments[2].opacity);
  });

  it('gives a discount the width of its size and marks it as subtractive', () => {
    const segments = buildPriceSegments([
      component('referencia', 210),
      component('margen_banco', -60),
      component('estabilidad', 15),
    ]);
    expect(segments[1].subtractive).toBe(true);
    expect(segments[1].share).toBeCloseTo((60 / 285) * 100, 6);
    expect(segments[2].subtractive).toBe(false);
  });

  it('keeps a zero component visible and survives an empty price', () => {
    const segments = buildPriceSegments([
      component('referencia', 210),
      component('incertidumbre_datos', 0),
    ]);
    expect(segments[1].share).toBeGreaterThan(0);
    expect(buildPriceSegments([])).toEqual([]);
  });
});

describe('levers', () => {
  const levers = [
    lever('deuda', 34),
    lever('liquidez', 395),
    lever('cobro', null),
  ];

  it('orders by the premium each one would save', () => {
    expect(sortLevers(levers).map((item) => item.pillar)).toEqual([
      'liquidez',
      'deuda',
      'cobro',
    ]);
    expect(levers[0].pillar).toBe('deuda');
  });

  it('names the pillar worth working on first, and nothing when there is none', () => {
    expect(topLeverPillar(levers)).toBe('liquidez');
    expect(topLeverPillar([lever('cobro', 0)])).toBeNull();
    expect(topLeverPillar([])).toBeNull();
  });
});

describe('fitPercent', () => {
  it('clamps the fit to the range the bar can draw', () => {
    expect(fitPercent(75)).toBe(75);
    expect(fitPercent(140)).toBe(100);
    expect(fitPercent(-5)).toBe(0);
    expect(fitPercent(null)).toBe(0);
  });
});

describe('sortReasons', () => {
  const reason = (
    code: string,
    kind: AdvisorReason['kind'],
    points: number,
  ): AdvisorReason => ({
    code,
    text: code,
    kind,
    points,
    variable: null,
    value: null,
    unit: null,
  });

  it('argues blockers first, then the heaviest pro, then the cons', () => {
    const ordered = sortReasons([
      reason('pulse_justo', 'contra', -10),
      reason('caja_corta', 'pro', 25),
      reason('sin_linea', 'pro', 10),
      reason('sin_erp', 'bloqueo', -100),
    ]);
    expect(ordered.map((item) => item.code)).toEqual([
      'sin_erp',
      'caja_corta',
      'sin_linea',
      'pulse_justo',
    ]);
  });
});

describe('formatReasonValue', () => {
  it('renders each unit the rules publish', () => {
    expect(formatReasonValue(14.03, 'días')).toBe('14,0 días');
    expect(formatReasonValue(247333.44, 'EUR/mes')).toBe('247.333 €/mes');
    expect(formatReasonValue(623191.46, 'EUR')).toBe('623.191 €');
    expect(formatReasonValue(0.03, 'tipo anual')).toBe('3,00 %');
    expect(formatReasonValue(38.56, 'PULSE')).toBe('38,6 PULSE');
    expect(formatReasonValue(7.39, 'puntos PULSE a +12 m')).toBe(
      '+7,4 puntos PULSE a +12 m',
    );
    expect(formatReasonValue(0.1148, '% vs trimestre anterior')).toBe(
      '11,5 % vs trimestre anterior',
    );
  });

  it('prints nothing when the rule reads no figure', () => {
    expect(formatReasonValue(null, 'días')).toBeNull();
    expect(formatReasonValue(14, null)).toBeNull();
  });
});

describe('sizing inputs', () => {
  it('labels the keys of the backend and humanises an unknown one', () => {
    expect(sizingInputLabel('cover_months')).toBe('Meses de pagos cubiertos');
    expect(sizingInputLabel('advance_rate')).toBe('Anticipo');
    expect(sizingInputLabel('new_ratio_key')).toBe('New ratio key');
  });

  it('renders each input in the unit its key implies', () => {
    expect(formatSizingInput('advance_rate', 0.85)).toBe('85 %');
    expect(formatSizingInput('cover_months', 0.35)).toBe('0,35 meses');
    expect(formatSizingInput('cash_days', 365)).toBe('365 días');
    expect(formatSizingInput('monthly_outflow', 79093.67)).toBe('79.094 €');
  });

  it('builds one row per input, in the published order', () => {
    expect(
      buildSizingRows({
        formula: 'x',
        inputs: { cover_months: 0.35, monthly_outflow: 79093.67 },
      }),
    ).toEqual([
      {
        key: 'cover_months',
        label: 'Meses de pagos cubiertos',
        value: '0,35 meses',
      },
      {
        key: 'monthly_outflow',
        label: 'Pagos operativos al mes',
        value: '79.094 €',
      },
    ]);
  });
});

describe('input rows', () => {
  it('names the facilities in force and the empty case', () => {
    expect(formatHoldingTypes(['loan', 'lineofcredit'])).toBe(
      'Préstamo, línea de crédito',
    );
    expect(formatHoldingTypes([])).toBe('Ninguno contratado');
  });

  it('keeps a zero apart from a figure that does not exist', () => {
    const rows = buildHoldingRows({
      types: [],
      lineLimit: 0,
      lineDrawn: 0,
      loanOutstanding: null,
      nLoans: 0,
      currentRate: null,
    });
    expect(rows[1].value).toBe('0 €');
    expect(rows[2].value).toBe('sin datos');
    expect(rows[3].value).toBe('sin datos');
  });

  it('says the invoices are unobservable without an ERP', () => {
    const rows = buildInvoiceRows({
      hasErp: false,
      openAr: 0,
      eligibleAr: 0,
      arMonthly: 0,
      openAp: 0,
      apMonthly: 0,
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].hint).toContain('Sin ERP conectado');
    expect(
      buildInvoiceRows({
        hasErp: true,
        openAr: 156000.46,
        eligibleAr: 154880,
        arMonthly: 98481.73,
        openAp: 177750.31,
        apMonthly: 63035.89,
      })[0].value,
    ).toBe('156.000 €');
  });
});

describe('formatRiskDriverValue', () => {
  it('renders each driver in its own unit', () => {
    expect(formatRiskDriverValue('confidence', 0.82)).toBe('82 %');
    expect(formatRiskDriverValue('pillar_liquidez', 34.3349)).toBe('34,3/100');
    expect(formatRiskDriverValue('log_months', 2.1972)).toBe('2,20');
    expect(formatRiskDriverValue('log_months', null)).toBe('sin datos');
  });
});

describe('shared labels', () => {
  it('signs every spread so its direction is unambiguous', () => {
    expect(formatSignedBps(707)).toBe('+707 pb');
    expect(formatSignedBps(-60)).toBe('−60 pb');
    expect(DECLINE_STATUS_LABELS.poco_encaje).toBe('Poco encaje');
  });
});
