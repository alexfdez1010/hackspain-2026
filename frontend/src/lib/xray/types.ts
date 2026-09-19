/**
 * Domain types for the Embat X-Ray dataset consumed by Embat Pulse.
 *
 * The upstream ML service may regenerate the JSON files at any time adding new
 * keys, so every structure below is treated as an open shape: parsers keep the
 * known fields and ignore the rest.
 */

/** Identifier of one of the six score pillars. */
export type PillarKey =
  'liquidity' | 'cashflow' | 'payments' | 'receivables' | 'debt' | 'activity';

/** Ordered pillar keys, used for every pillar rendering (radar, bars, heatmap). */
export const PILLAR_KEYS: readonly PillarKey[] = [
  'liquidity',
  'cashflow',
  'payments',
  'receivables',
  'debt',
  'activity',
];

/** Direction of the 6-month score trajectory. */
export type Direction = 'improving' | 'stable' | 'deteriorating';

/** Regime detected by the changepoint model. */
export type Regime =
  | 'steady'
  | 'structural_decline'
  | 'structural_improvement'
  | 'transient_dip'
  | 'transient_spike';

/** Pillar scores in the 0-100 range; `null` when the pillar has no evidence. */
export type Pillars = Record<PillarKey, number | null>;

/** A single SHAP-derived driver of the score, already translated to Spanish. */
export interface Reason {
  feature: string;
  label: string;
  pillar: string;
  /** Contribution in score points; negative values hurt the score. */
  impact: number;
  value: number | null;
}

/** One step of the month-over-month score decomposition. */
export interface WaterfallStep {
  feature: string;
  label: string;
  delta_points: number;
  value_before: number | null;
  value_after: number | null;
}

/** Narrative explanation of the latest score movement. */
export interface Explanation {
  waterfall: WaterfallStep[];
  narrative_es: string;
  regime_text_es: string;
}

/** Raw monthly KPIs behind the score. Every field may be missing. */
export interface RawKpis {
  inflow: number | null;
  outflow: number | null;
  net: number | null;
  cash_end: number | null;
  cash_min: number | null;
  dso_days: number | null;
  supplier_delay_days: number | null;
  overdue_ar: number | null;
  overdue_ap: number | null;
  loc_utilization: number | null;
  returned_debit_n: number | null;
  stress_n: number | null;
  n_tx: number | null;
  n_counterparties: number | null;
  debt_outstanding: number | null;
  payroll: number | null;
  tax_paid: number | null;
}

/** One observed month of a company, ascending by `month`. */
export interface MonthRecord {
  month: string;
  score: number;
  score_raw: number | null;
  composite: number | null;
  p_stress: number;
  trend_6m: number;
  direction: Direction;
  regime: Regime;
  regime_shift: number | null;
  changepoint_month: string | null;
  pillars: Pillars;
  raw: RawKpis;
  reasons: Reason[];
  stress_now: 0 | 1;
}

/** A scored company. `series` is only present in the per-company JSON file. */
export interface Company {
  company_id: string;
  group_id: string;
  months_observed: number;
  score: number;
  score_prev: number | null;
  score_6m_ago: number | null;
  trend_6m: number;
  direction: Direction;
  regime: Regime;
  p_stress: number;
  pillars: Pillars;
  reasons: Reason[];
  explanation?: Explanation;
  series?: MonthRecord[];
}

/** Severity of a monitor alert. */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/** A single alert raised by the monitoring rules. */
export interface Alert {
  company_id: string;
  month: string;
  type: string;
  severity: AlertSeverity;
  title_es: string;
  detail_es: string;
  score: number | null;
  delta: number | null;
}

export type { Anticipation } from '@/lib/xray/anticipation';

/** Root object of `summary.json`. */
export interface XraySummary {
  generated_for: string;
  pillar_labels: Record<string, string>;
  feature_labels: Record<string, string>;
  companies: Company[];
  alerts: Alert[];
  alert_counts: Record<string, number>;
  anticipation: import('@/lib/xray/anticipation').Anticipation;
}
