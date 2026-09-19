/** Score of one of the eleven variables in one month. */
export interface PulseVariableValue {
  /** 0-100 score of the variable; `null` when there is no evidence. */
  score: number | null;
  /** Raw figure behind the score, in the unit declared by the metadata. */
  raw: number | null;
  /** `false` when the month carries no data for this variable. */
  known: boolean;
}

/** Pillar scores of one month, keyed by pillar. */
export type PulsePillars = Record<string, number | null>;

/** Points each contribution key adds to the raw score. */
export type PulseContributions = Record<string, number>;

/** One pillar of the score with the points it can contribute. */
export interface PulsePillarMeta {
  key: string;
  label: string;
  /** Points of the 100 owned by the pillar. */
  weight: number;
}

/** One variable of the score with its pillar, weight and unit. */
export interface PulseVariableMeta {
  key: string;
  /** Position of the variable in the published specification. */
  number: number;
  label: string;
  /** Key of the pillar the variable feeds. */
  pillar: string;
  /** Points of the 100 owned by the variable. */
  weight: number;
  /** Name of the raw column behind the score. */
  raw: string;
  /** Unit of the raw figure, used to render it. */
  unit: string;
}

/** Labels, weights and horizons shared by every PULSE view. */
export interface PulseMeta {
  generatedFor: string;
  scoreName: string;
  /** What the acronym stands for. */
  scoreExpansion: string;
  /** Forecast horizons in months, ascending. */
  horizons: number[];
  /** Last month with observed data, as `YYYY-MM`. */
  lastMonth: string;
  pillars: PulsePillarMeta[];
  variables: PulseVariableMeta[];
  /** Variable keys plus `contexto` and `base`. */
  contributionKeys: string[];
}

/** Forecast of the score at one horizon, with its 80 % band. */
export interface PulseForecastBand {
  pulsePred: number | null;
  pulseP10: number | null;
  pulseP90: number | null;
}

/** One company as the portfolio table reads it. */
export interface PulseCompanyRow {
  companyId: string;
  groupId: string;
  /** Number of months with observed data. */
  monthsObserved: number;
  pulse: number | null;
  /** Score of the previous month, the base of the monthly change. */
  pulsePrev: number | null;
  /** Share of the 100 points backed by data, between 0 and 1. */
  confidence: number | null;
  pillars: PulsePillars;
  /** Six-month forecast, or `null` when it could not be computed. */
  forecast6m: PulseForecastBand | null;
}

/** Metadata plus one row per company. */
export interface PulseSummary {
  meta: PulseMeta;
  companies: PulseCompanyRow[];
}

/** One observed month of a company. */
export interface PulseSeriesPoint {
  month: string;
  pulse: number | null;
  /** Score before the confidence shrinkage towards the neutral level. */
  pulseRaw: number | null;
  confidence: number | null;
  pillars: PulsePillars;
  variables: Record<string, PulseVariableValue>;
  /** Points each variable adds to `pulseRaw` this month. */
  contributions: PulseContributions;
  /** Cash balance at the end of the month, in euros. */
  cashEnd: number | null;
}

/** One forecast horizon with its decomposition. */
export interface PulseForecastPoint extends PulseForecastBand {
  /** Horizon in months ahead of the last observed month. */
  horizon: number;
  /** Month the forecast refers to, as `YYYY-MM`. */
  targetMonth: string;
  /** Predicted change of `pulseRaw`; the contributions sum to it. */
  deltaRaw: number | null;
  contributions: PulseContributions;
}

/** A company with its monthly history and its six forecast horizons. */
export interface PulseCompany {
  companyId: string;
  groupId: string;
  monthsObserved: number;
  /** Last observed month, as `YYYY-MM`. */
  month: string;
  pulse: number | null;
  pulsePrev: number | null;
  confidence: number | null;
  pillars: PulsePillars;
  /** Observed months, ascending. */
  series: PulseSeriesPoint[];
  /** Horizons +1 to +6, ascending. */
  forecast: PulseForecastPoint[];
}
