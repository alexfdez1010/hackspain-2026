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

/** Published evaluation of the score itself. */
export interface PulseScoreEvaluation {
  /** Company-months with an observable six-month future. */
  rows: number | null;
  /** Share of those months followed by a stress episode. */
  stressRate: number | null;
  /** AUROC of PULSE for "no stress in the next six months". */
  auroc: number | null;
  /** Same AUROC restricted to companies not stressed today. */
  aurocExcludingCurrentStress: number | null;
  /** AUROC on months from September 2025 onwards. */
  aurocTemporal: number | null;
  /** AUROC of each variable on its own, keyed by variable. */
  aurocByVariable: Record<string, number>;
}

/** Out-of-fold accuracy of the forecast at one horizon. */
export interface PulseForecastHorizonEvaluation {
  horizon: number;
  rows: number | null;
  /** Mean absolute error of "the score stays where it is". */
  maePersist: number | null;
  /** Mean absolute error of a one-parameter mean-reversion baseline. */
  maeReversion: number | null;
  /** Mean absolute error of the model. */
  maeMl: number | null;
  gainVsPersistPct: number | null;
  gainVsReversionPct: number | null;
  /** Share of moves larger than 15 points whose direction was right. */
  directionAccuracyBigMoves: number | null;
  recallDeclines: number | null;
  recallImprovements: number | null;
  /** Share of outcomes that fell inside the p10-p90 band. */
  bandCoverage: number | null;
}

/** Evaluation of the logistic stress model that prices the risk premium. */
export interface PulseRiskEvaluation {
  rows: number | null;
  stressRate: number | null;
  auroc: number | null;
  /** Standardised coefficients per feature; negative lowers the risk. */
  coefficientsStd: Record<string, number>;
}

/** How well today's score ranks the cash stress that arrives `horizon` months later. */
export interface PulseAnticipationHorizon {
  horizon: number;
  rows: number | null;
  /** Share of clean company-months followed by stress within the horizon. */
  baseRate: number | null;
  auroc: number | null;
  /** Share of companies an alert flags, lowest scores first. */
  alertShare: number | null;
  /** Share of the coming stress episodes the alert catches. */
  recall: number | null;
  /** Stress rate among the flagged companies. */
  precision: number | null;
  /** Precision divided by the base rate. */
  lift: number | null;
}

/** Out-of-fold quality of the model that tells a lasting move from a blip. */
export interface PulsePersistenceEvaluation {
  signals: number | null;
  persistentShare: number | null;
  auroc: number | null;
}

/** Published evaluation of the signals layer. */
export interface PulseSignalsEvaluation {
  /** One entry per horizon, ascending; empty when not exported. */
  anticipation: PulseAnticipationHorizon[];
  /** Persistence model per direction of move. */
  persistence: {
    down: PulsePersistenceEvaluation;
    up: PulsePersistenceEvaluation;
  };
}

/** Every published evaluation figure, for the method page. */
export interface PulseEvaluation {
  score: PulseScoreEvaluation;
  /** One entry per horizon, ascending. */
  forecast: PulseForecastHorizonEvaluation[];
  risk: PulseRiskEvaluation;
  signals: PulseSignalsEvaluation;
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
  /** Published evaluation figures; empty blocks when not exported. */
  evaluation: PulseEvaluation;
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
  /** Six-month (+6) forecast, or `null` when it could not be computed. */
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
  /** Weighted mean of the known variables, 0-100. */
  pulse: number | null;
  confidence: number | null;
  pillars: PulsePillars;
  variables: Record<string, PulseVariableValue>;
  /** Points each variable adds to `pulse` this month; they sum to it. */
  contributions: PulseContributions;
  /** Cash balance at the end of the month, in euros. */
  cashEnd: number | null;
}

/**
 * Farthest forecast horizon the app shows, in months.
 *
 * The export publishes +1..+6; the parser drops anything beyond this, so
 * every chart, table and decomposition reads the same six months.
 */
export const PULSE_FORECAST_MONTHS = 6;

/** One forecast horizon with its decomposition. */
export interface PulseForecastPoint extends PulseForecastBand {
  /** Horizon in months ahead of the last observed month. */
  horizon: number;
  /** Month the forecast refers to, as `YYYY-MM`. */
  targetMonth: string;
  /** Predicted change of PULSE; the contributions sum to it. */
  delta: number | null;
  contributions: PulseContributions;
}

/** Name of an episode: falls are `caida` or `bache`, rises `mejora` or `repunte`. */
export type PulseSignalKind = 'caida' | 'bache' | 'mejora' | 'repunte';

/** A pillar that moved with the score when the signal opened. */
export interface PulseSignalDriver {
  pillar: string;
  /** Spanish label of the pillar. */
  label: string;
  /** Points the pillar moved against its three-month baseline. */
  delta: number;
}

/** A month where the score really moved, and what it turned out to be. */
export interface PulseSignal {
  /** Month the episode opened, as `YYYY-MM`. */
  month: string;
  kind: PulseSignalKind;
  direction: 'down' | 'up';
  /** Score the month the signal opened. */
  level: number | null;
  /** Mean of the three previous months. */
  baseline: number | null;
  /** `level` minus `baseline`, in points. */
  move: number | null;
  /** Pillars that moved the same way. */
  breadth: number;
  confidence: number | null;
  /** Points each pillar moved against its baseline. */
  pillarDeltas: Record<string, number | null>;
  /** Pillars that moved with the score, largest first. */
  drivers: PulseSignalDriver[];
  /** Probability, read the month it opened, that the move lasts. */
  pPersistent: number | null;
  /** What happened three months later; `null` while still open. */
  outcome: 'persistente' | 'transitorio' | null;
  /** «Caída de 12 puntos en marzo de 2026». */
  headline: string;
  /** One sentence with the move, its drivers and the probability or outcome. */
  detail: string;
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
  /** Horizons +1 to `PULSE_FORECAST_MONTHS`, ascending. */
  forecast: PulseForecastPoint[];
  /** Episodes where the score really moved, oldest first. */
  signals: PulseSignal[];
}
