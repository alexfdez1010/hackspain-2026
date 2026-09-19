import type {
  PulseCompanyRow,
  PulseForecastPoint,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';

/**
 * Builds a portfolio row with sensible defaults.
 *
 * @param overrides - Fields to replace.
 * @returns One row of the PULSE portfolio.
 */
export function makeRow(
  overrides: Partial<PulseCompanyRow> = {},
): PulseCompanyRow {
  return {
    companyId: 'COMP_0001',
    groupId: 'GROUP_0147',
    monthsObserved: 8,
    pulse: 40,
    pulsePrev: 35,
    confidence: 0.8,
    pillars: { liquidez: 40, deuda: 40, cobro: 40, pago: 40 },
    forecast6m: { pulsePred: 38, pulseP10: 20, pulseP90: 55 },
    ...overrides,
  };
}

/**
 * Builds an observed month with two variables, one of them unknown.
 *
 * @param overrides - Fields to replace.
 * @returns One month of the PULSE series.
 */
export function makeSeriesPoint(
  overrides: Partial<PulseSeriesPoint> = {},
): PulseSeriesPoint {
  return {
    month: '2026-08',
    pulse: 40,
    confidence: 0.8,
    pillars: { liquidez: 40, deuda: 40, cobro: 40, pago: 40 },
    variables: {
      cash_days: { score: 38.96, raw: 14.03, known: true },
      loc_util: { score: null, raw: null, known: false },
    },
    contributions: { cash_days: 5.7, loc_util: 0 },
    cashEnd: 36_982.49,
    ...overrides,
  };
}

/**
 * Builds a forecast horizon whose contributions sum to `delta`.
 *
 * @param overrides - Fields to replace.
 * @returns One forecast horizon.
 */
export function makeForecastPoint(
  overrides: Partial<PulseForecastPoint> = {},
): PulseForecastPoint {
  return {
    horizon: 6,
    targetMonth: '2027-02',
    pulsePred: 38,
    pulseP10: 20,
    pulseP90: 55,
    delta: -1.5,
    contributions: { cash_days: 0.5, loc_util: -0.4, contexto: -0.6, base: -1 },
    ...overrides,
  };
}

/** The two variables used by the fixtures, with their published weights. */
export const VARIABLE_META: PulseVariableMeta[] = [
  {
    key: 'cash_days',
    number: 1,
    label: 'Días de caja',
    pillar: 'liquidez',
    weight: 12,
    raw: 'cash_days',
    unit: 'días',
  },
  {
    key: 'loc_util',
    number: 3,
    label: 'Utilización de líneas',
    pillar: 'deuda',
    weight: 14,
    raw: 'loc_util',
    unit: '% del límite',
  },
];
