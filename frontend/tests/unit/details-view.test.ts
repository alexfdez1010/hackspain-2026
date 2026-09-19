import { describe, expect, it } from 'vitest';

import {
  AGING_BUCKETS,
  agingBucketLabel,
  agingBucketView,
  utilisationBand,
} from '@/lib/pulse/details/bands';
import type { DetailMonth } from '@/lib/pulse/details/types';
import {
  accelSentence,
  DETAIL_TITLES,
  detailTitle,
  formatDay,
  growthText,
  lastDetailMonth,
  lastValue,
  lateDaysHint,
} from '@/lib/pulse/details/view';

const MONTHS: DetailMonth[] = [
  { month: '2026-07', values: { cashEnd: 10, ratio: null } },
  { month: '2026-08', values: { cashEnd: 20, ratio: 0.5 } },
];

describe('detailTitle', () => {
  it('names the drill-down of the eleven variables', () => {
    expect(Object.keys(DETAIL_TITLES)).toHaveLength(11);
    expect(detailTitle('network')).toBe('Salud de pago de los clientes');
    expect(detailTitle('cash_days')).toBe('Caja diaria y cuentas');
    expect(detailTitle('not_a_variable')).toBeNull();
  });
});

describe('aging buckets', () => {
  it('publishes the five buckets from the oldest debt to the newest', () => {
    expect(AGING_BUCKETS.map((entry) => entry.key)).toEqual([
      'al_dia',
      '1_30',
      '31_60',
      '61_90',
      'mas_90',
    ]);
    expect(agingBucketLabel('mas_90')).toBe('+90 días');
    expect(agingBucketLabel('al_dia')).toBe('Al día');
  });

  it('colours the tail as critical and the rest below it', () => {
    expect(agingBucketView('mas_90').color).toBe('var(--score-critical)');
    expect(agingBucketView('61_90').color).toBe('var(--score-fragile)');
    expect(agingBucketView('31_60').color).toBe('var(--score-neutral)');
  });

  it('keeps an unknown bucket readable instead of dropping it', () => {
    expect(agingBucketView('91_120')).toEqual({
      key: '91_120',
      label: '91_120',
      color: 'var(--surface-tertiary)',
      opacity: 1,
    });
  });
});

describe('utilisationBand', () => {
  it('bands a credit line by how close it is to its limit', () => {
    expect(utilisationBand(0.14).label).toBe('holgada');
    expect(utilisationBand(0.5).label).toBe('uso medio');
    expect(utilisationBand(0.79).label).toBe('uso medio');
    expect(utilisationBand(0.98).label).toBe('cerca del límite');
    expect(utilisationBand(1).label).toBe('cerca del límite');
    expect(utilisationBand(1.2).color).toBe('var(--score-critical)');
    expect(utilisationBand(null).label).toBe('sin límite conocido');
  });
});

describe('lateDaysHint', () => {
  it('says whether the counterparty settles early, on time or late', () => {
    expect(lateDaysHint(-20, 'supplier')).toBe('Se le paga 20,0 días pronto');
    expect(lateDaysHint(0, 'supplier')).toBe('Se le paga en plazo');
    expect(lateDaysHint(31.74, 'customer')).toBe('Paga 31,7 días tarde');
    expect(lateDaysHint(null, 'customer')).toBe('Paga sin facturas cerradas');
  });
});

describe('formatDay', () => {
  it('renders an ISO day in Spanish without a leading zero', () => {
    expect(formatDay('2026-08-02')).toBe('2 ago 2026');
    expect(formatDay('2026-08-11')).toBe('11 ago 2026');
    expect(formatDay('2026-13-99')).toBe('2026-13-99');
    expect(formatDay('')).toBe('');
  });
});

describe('growthText', () => {
  it('signs the growth and names the case without a base quarter', () => {
    expect(growthText(-0.37)).toBe('−37 %');
    expect(growthText(1)).toBe('+100 %');
    expect(growthText(0)).toBe('0 %');
    expect(growthText(null)).toBe('sin base');
  });
});

describe('month helpers', () => {
  it('reads the last month and one of its columns', () => {
    expect(lastDetailMonth(MONTHS)?.month).toBe('2026-08');
    expect(lastDetailMonth([])).toBeNull();
    expect(lastValue(MONTHS, 'cashEnd')).toBe(20);
    expect(lastValue(MONTHS, 'missing')).toBeNull();
    expect(lastValue([], 'cashEnd')).toBeNull();
  });
});

describe('accelSentence', () => {
  it('reads both moves in points of the limit', () => {
    expect(accelSentence(0.27, 0.32)).toBe(
      'La utilización sube 27,0 puntos en 3 meses y ese ritmo se acelera 32,0 puntos.',
    );
    expect(accelSentence(-0.26, -0.5)).toBe(
      'La utilización baja 26,0 puntos en 3 meses y ese ritmo se frena 50,0 puntos.',
    );
    expect(accelSentence(0.1, null)).toBe(
      'La utilización sube 10,0 puntos en 3 meses y sin ritmo comparable.',
    );
    expect(accelSentence(null, null)).toContain('Sin utilización medida');
  });
});
