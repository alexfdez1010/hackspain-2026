import { describe, expect, it } from 'vitest';

import { buildBandSpans } from '@/lib/method/bands';
import {
  buildConfidenceSegments,
  buildMethodExample,
} from '@/lib/method/example';
import { buildPriceSteps } from '@/lib/method/pricing';
import { charsPerLine, wrapLabel } from '@/lib/method/text';
import { buildWeightMap } from '@/lib/method/weights';
import type {
  AdvisorPricingParameters,
  AdvisorProduct,
  AdvisorReferenceRate,
} from '@/lib/advisor/types';
import type {
  PulseCompany,
  PulsePillarMeta,
  PulseVariableMeta,
} from '@/lib/pulse/types';
import { makeSeriesPoint, VARIABLE_META } from './pulse-fixtures';

const PILLARS: PulsePillarMeta[] = [
  { key: 'cobro', label: 'Calidad de cobro', weight: 36 },
  { key: 'liquidez', label: 'Liquidez', weight: 26 },
  { key: 'deuda', label: 'Deuda y servicio', weight: 26 },
  { key: 'pago', label: 'Comportamiento de pago', weight: 12 },
];

/** The eleven published variables, as `meta.variables` carries them. */
const FULL_VARIABLES: PulseVariableMeta[] = [
  ['cash_days', 1, 'Días de caja', 'liquidez', 12],
  ['cash_min', 2, 'Mínimo intramensual de caja', 'liquidez', 14],
  ['loc_util', 3, 'Utilización de líneas', 'deuda', 12],
  ['loc_accel', 4, 'Aceleración de utilización', 'deuda', 6],
  ['dpo', 5, 'DPO real y su variación', 'pago', 6],
  ['terms', 6, 'Plazo concedido por proveedores', 'pago', 6],
  ['dso', 7, 'DSO real', 'cobro', 6],
  ['ar90', 8, 'Tramo +90 días', 'cobro', 12],
  ['top_client', 9, 'Caída del cliente top', 'cobro', 8],
  ['maturities', 10, 'Vencimientos 6 m sobre caja', 'deuda', 8],
  ['network', 12, 'Exposición a contrapartes', 'cobro', 10],
].map(([key, number, label, pillar, weight]) => ({
  key: key as string,
  number: number as number,
  label: label as string,
  pillar: pillar as string,
  weight: weight as number,
  raw: key as string,
  unit: 'pts',
}));

const COMPANY: PulseCompany = {
  companyId: 'COMP_0001',
  groupId: 'GROUP_0147',
  monthsObserved: 8,
  month: '2026-08',
  pulse: 32.77,
  pulsePrev: 17.88,
  confidence: 0.82,
  pillars: { liquidez: 34.33, deuda: 33.97, cobro: 54.58, pago: 51.12 },
  series: [makeSeriesPoint()],
  forecast: [],
};

const PRICING: AdvisorPricingParameters = {
  maxRiskPremiumBps: 900,
  maxDataUncertaintyBps: 75,
  stressToDefault: 0.25,
  trendDeclineBps: 25,
  trendImproveBps: -15,
  minConfidenceForCredit: 0.25,
};

const REFERENCE: AdvisorReferenceRate = {
  label: 'Euríbor 12 m',
  value: 0.021,
  source: 'default',
};

const PRODUCTS: AdvisorProduct[] = [
  {
    key: 'credit_line',
    label: 'Línea de crédito',
    family: 'circulante',
    what: 'Póliza de la que dispones cuando la caja lo necesita.',
    rateKind: 'cost',
    baseSpreadBps: 150,
    lgd: 0.45,
    minSpreadBps: 40,
    maxSpreadBps: 990,
    tenorMonths: 12,
  },
  {
    key: 'confirming',
    label: 'Confirming de proveedores',
    family: 'pagos',
    what: 'El banco paga a tus proveedores y tú liquidas más tarde.',
    rateKind: 'cost',
    baseSpreadBps: 90,
    lgd: 0.3,
    minSpreadBps: 0,
    maxSpreadBps: 690,
    tenorMonths: 12,
  },
  {
    key: 'treasury_deposit',
    label: 'Depósito de excedentes',
    family: 'tesoreria',
    what: 'Remunera la caja que no vas a necesitar.',
    rateKind: 'yield',
    baseSpreadBps: -60,
    lgd: 0,
    minSpreadBps: -100,
    maxSpreadBps: 0,
    tenorMonths: 6,
  },
];

describe('treemap of the 100 points', () => {
  it('gives every cell an area proportional to its weight', () => {
    const map = buildWeightMap(PILLARS, FULL_VARIABLES, {
      width: 720,
      height: 300,
    });
    const total = FULL_VARIABLES.reduce(
      (sum, variable) => sum + variable.weight,
      0,
    );
    const area = 720 * 300;
    for (const segment of map.segments) {
      expect(segment.width * segment.height).toBeCloseTo(
        (segment.weight / total) * area,
        4,
      );
    }
    expect(map.totalWeight).toBe(100);
    expect(map.segments).toHaveLength(FULL_VARIABLES.length);
  });

  it('orders the columns by weight and fills the drawing exactly', () => {
    const map = buildWeightMap(PILLARS, FULL_VARIABLES, {
      width: 720,
      height: 300,
      columnGap: 6,
      rowGap: 4,
    });
    expect(map.groups.map((group) => group.key)).toEqual([
      'cobro',
      'deuda',
      'liquidez',
      'pago',
    ]);
    const last = map.groups[map.groups.length - 1];
    expect(last.x + last.width).toBeCloseTo(720, 6);
    for (const group of map.groups) {
      const tail = group.segments[group.segments.length - 1];
      expect(tail.y + tail.height).toBeCloseTo(300, 6);
      expect(group.segments.map((segment) => segment.weight)).toEqual(
        [...group.segments]
          .map((segment) => segment.weight)
          .sort((a, b) => b - a),
      );
    }
  });

  it('never overlaps two cells of the same column', () => {
    const map = buildWeightMap(PILLARS, FULL_VARIABLES, { rowGap: 4 });
    for (const group of map.groups) {
      group.segments.reduce((bottom, segment) => {
        expect(segment.y).toBeGreaterThanOrEqual(bottom);
        return segment.y + segment.height;
      }, 0);
    }
  });

  it('keeps a column when its variables do not add up to its weight', () => {
    const map = buildWeightMap(PILLARS, VARIABLE_META, { width: 100 });
    const liquidez = map.groups.find((group) => group.key === 'liquidez');
    expect(liquidez?.width).toBeCloseTo(26, 6);
    expect(liquidez?.segments[0].height).toBeCloseTo(300, 6);
    expect(map.groups.find((group) => group.key === 'pago')?.segments).toEqual(
      [],
    );
  });

  it('degrades to an empty map when the export publishes nothing', () => {
    const map = buildWeightMap([], []);
    expect(map.segments).toEqual([]);
    expect(map.totalWeight).toBe(0);
  });
});

describe('score bands', () => {
  it('covers the whole scale and names every cut', () => {
    const spans = buildBandSpans();
    expect(spans.map((span) => span.range)).toEqual([
      '< 35',
      '35-50',
      '50-65',
      '> 65',
    ]);
    expect(spans.map((span) => span.name)).toEqual([
      'Crítico',
      'Frágil',
      'Neutro',
      'Sólido',
    ]);
    const width = spans.reduce((sum, span) => sum + span.width, 0);
    expect(width).toBeCloseTo(100, 6);
    expect(spans[0].width).toBeCloseTo(35, 6);
  });
});

describe('label wrapping inside a cell', () => {
  it('breaks on words and keeps the line budget', () => {
    expect(wrapLabel('Mínimo intramensual de caja', 14, 2)).toEqual([
      'Mínimo',
      'intramensual…',
    ]);
    expect(wrapLabel('DSO real', 20, 2)).toEqual(['DSO real']);
    expect(wrapLabel('Vencimientos 6 m sobre caja', 40, 2)).toEqual([
      'Vencimientos 6 m sobre caja',
    ]);
  });

  it('cuts a word that does not fit and answers empty boxes', () => {
    expect(wrapLabel('Contrapartes', 6, 1)).toEqual(['Contr…']);
    expect(wrapLabel('Liquidez', 0, 2)).toEqual([]);
    expect(charsPerLine(110, 13)).toBe(15);
    expect(charsPerLine(110, 0)).toBe(0);
  });
});

describe('worked example of one month', () => {
  it('keeps only the variables with evidence and adds them up', () => {
    const example = buildMethodExample(COMPANY, VARIABLE_META, PILLARS);
    expect(example).not.toBeNull();
    const rows = example?.rows ?? [];
    expect(
      rows.every((row) => row.contribution > 0 || row.score !== null),
    ).toBe(true);
    expect(rows.map((row) => row.key)).not.toContain('loc_util');
    expect(example?.contributionSum).toBeCloseTo(
      rows.reduce((sum, row) => sum + row.contribution, 0),
      6,
    );
    expect(example?.unknownLabels).toContain('Utilización de líneas');
    expect(example?.unknownWeight).toBeGreaterThan(0);
    expect(rows[0].contribution).toBeGreaterThanOrEqual(
      rows[rows.length - 1].contribution,
    );
  });

  it('answers null when there is no observed month', () => {
    expect(buildMethodExample(null, VARIABLE_META, PILLARS)).toBeNull();
    expect(
      buildMethodExample({ ...COMPANY, series: [] }, VARIABLE_META, PILLARS),
    ).toBeNull();
  });

  it('marks a variable without evidence as uncovered', () => {
    const segments = buildConfidenceSegments(VARIABLE_META, makeSeriesPoint());
    const byKey = new Map(segments.map((item) => [item.key, item.coverage]));
    expect(byKey.get('loc_util')).toBe('unknown');
    expect(byKey.get('cash_days')).toBe('known');
    expect(buildConfidenceSegments(VARIABLE_META, null)).toHaveLength(
      VARIABLE_META.length,
    );
    expect(
      buildConfidenceSegments(VARIABLE_META, null).every(
        (segment) => segment.coverage === 'unknown',
      ),
    ).toBe(true);
  });
});

describe('price stack', () => {
  it('quotes the published constants and the margin band', () => {
    const steps = buildPriceSteps(PRICING, REFERENCE, PRODUCTS);
    expect(steps.map((step) => step.key)).toEqual([
      'referencia',
      'margen',
      'riesgo',
      'datos',
      'tendencia',
      'total',
    ]);
    expect(steps[0].amount).toContain('2,10');
    expect(steps[1].amount).toBe('90 a 150 pb');
    expect(steps[2].detail).toContain('900 pb');
    expect(steps[3].amount).toContain('75 pb');
    expect(steps[4].amount).toBe('+25 o −15 pb');
    expect(steps[5].role).toBe('total');
  });

  it('survives an empty catalogue', () => {
    const steps = buildPriceSteps(PRICING, REFERENCE, []);
    expect(steps[1].amount).toBe('fijo por producto');
  });
});
