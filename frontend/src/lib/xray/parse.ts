import {
  asRecord,
  toArray,
  toDirection,
  toNumber,
  toNumberOrNull,
  toPillars,
  toRegime,
  toText,
  toTextOrNull,
} from '@/lib/xray/parse-primitives';
import type {
  Company,
  Explanation,
  MonthRecord,
  RawKpis,
  Reason,
  WaterfallStep,
} from '@/lib/xray/types';

const RAW_KPI_KEYS: readonly (keyof RawKpis)[] = [
  'inflow',
  'outflow',
  'net',
  'cash_end',
  'cash_min',
  'dso_days',
  'supplier_delay_days',
  'overdue_ar',
  'overdue_ap',
  'loc_utilization',
  'returned_debit_n',
  'stress_n',
  'n_tx',
  'n_counterparties',
  'debt_outstanding',
  'payroll',
  'tax_paid',
];

/**
 * Parses the SHAP-derived drivers attached to a company or a month.
 *
 * @param value - Candidate list of reasons.
 * @returns Reasons with a label and a finite impact, in source order.
 */
export function parseReasons(value: unknown): Reason[] {
  return toArray(value).flatMap((item) => {
    const record = asRecord(item);
    if (!record) return [];
    return [
      {
        feature: toText(record.feature),
        label: toText(record.label, toText(record.feature)),
        pillar: toText(record.pillar),
        impact: toNumber(record.impact),
        value: toNumberOrNull(record.value),
      },
    ];
  });
}

/**
 * Parses the raw monthly KPIs, keeping `null` for every missing measurement.
 *
 * @param value - Candidate raw KPI object.
 * @returns A complete KPI record.
 */
export function parseRawKpis(value: unknown): RawKpis {
  const record = asRecord(value) ?? {};
  const kpis = {} as RawKpis;
  for (const key of RAW_KPI_KEYS) kpis[key] = toNumberOrNull(record[key]);
  return kpis;
}

/**
 * Parses the optional month-over-month explanation block.
 *
 * @param value - Candidate explanation object.
 * @returns The explanation, or `undefined` when the model did not emit one.
 */
export function parseExplanation(value: unknown): Explanation | undefined {
  const record = asRecord(value);
  if (!record) return undefined;
  const waterfall: WaterfallStep[] = toArray(record.waterfall).flatMap(
    (item) => {
      const step = asRecord(item);
      if (!step) return [];
      return [
        {
          feature: toText(step.feature),
          label: toText(step.label, toText(step.feature)),
          delta_points: toNumber(step.delta_points),
          value_before: toNumberOrNull(step.value_before),
          value_after: toNumberOrNull(step.value_after),
        },
      ];
    },
  );
  const narrative = toText(record.narrative_es);
  const regimeText = toText(record.regime_text_es);
  if (waterfall.length === 0 && narrative === '' && regimeText === '') {
    return undefined;
  }
  return {
    waterfall,
    narrative_es: narrative,
    regime_text_es: regimeText,
  };
}

/**
 * Parses one observed month of a company.
 *
 * @param value - Candidate month object.
 * @returns A month record, or `null` when the month label is missing.
 */
export function parseMonthRecord(value: unknown): MonthRecord | null {
  const record = asRecord(value);
  if (!record) return null;
  const month = toTextOrNull(record.month);
  if (!month) return null;
  return {
    month,
    score: toNumber(record.score),
    score_raw: toNumberOrNull(record.score_raw),
    composite: toNumberOrNull(record.composite),
    p_stress: toNumber(record.p_stress),
    trend_6m: toNumber(record.trend_6m),
    direction: toDirection(record.direction),
    regime: toRegime(record.regime),
    regime_shift: toNumberOrNull(record.regime_shift),
    changepoint_month: toTextOrNull(record.changepoint_month),
    pillars: toPillars(record.pillars),
    raw: parseRawKpis(record.raw),
    reasons: parseReasons(record.reasons),
    stress_now: toNumber(record.stress_now) === 1 ? 1 : 0,
  };
}

/**
 * Parses a company, with or without its monthly series.
 *
 * @param value - Candidate company object.
 * @returns The company, or `null` when it has no identifier.
 */
export function parseCompany(value: unknown): Company | null {
  const record = asRecord(value);
  if (!record) return null;
  const id = toTextOrNull(record.company_id);
  if (!id) return null;
  const series = Array.isArray(record.series)
    ? record.series.flatMap((item) => parseMonthRecord(item) ?? [])
    : undefined;
  return {
    company_id: id,
    group_id: toText(record.group_id, 'SIN_GRUPO'),
    months_observed: toNumber(record.months_observed, series?.length ?? 0),
    score: toNumber(record.score),
    score_prev: toNumberOrNull(record.score_prev),
    score_6m_ago: toNumberOrNull(record.score_6m_ago),
    trend_6m: toNumber(record.trend_6m),
    direction: toDirection(record.direction),
    regime: toRegime(record.regime),
    p_stress: toNumber(record.p_stress),
    pillars: toPillars(record.pillars),
    reasons: parseReasons(record.reasons),
    explanation: parseExplanation(record.explanation),
    ...(series ? { series } : {}),
  };
}
