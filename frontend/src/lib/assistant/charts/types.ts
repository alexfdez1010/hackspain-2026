import type { DailyBalancePoint } from '@/lib/pulse/details/types';
import type {
  PulseContributionItem,
  PulseTrajectoryPoint,
} from '@/lib/pulse/company-view';
import type { PulsePillarSeries } from '@/lib/pulse/pillar-series';
import type { PulseSignal, PulseVariableMeta } from '@/lib/pulse/types';
import type {
  PulseVariablePoint,
  PulseVariableStats,
} from '@/lib/pulse/variable-series';

/** Kinds of chart Nexo can put in a reply; every one is built from the export. */
export const CHART_KINDS = [
  'trayectoria',
  'pilares',
  'variables',
  'puntos',
  'variable',
  'impulsores',
  'caja',
  'ranking',
  'comparar',
] as const;

export type ChartKind = (typeof CHART_KINDS)[number];

/** Counterparty and product rankings the detail export can answer. */
export const RANKING_KINDS = [
  'clientes_dso',
  'clientes_cobros',
  'proveedores_dpo',
  'proveedores_pagos',
  'morosidad',
  'concentracion',
  'lineas',
  'deuda',
  'red',
  'antiguedad',
] as const;

export type RankingKind = (typeof RANKING_KINDS)[number];

/** What every chart carries besides its data: who, when and what it says. */
export interface ChartBase {
  /** Name of the company, never its identifier. */
  company: string;
  /** Reference month of the data, as `YYYY-MM`. */
  month: string;
  title: string;
  /** One sentence the model receives instead of the data. */
  summary: string;
  /** Page of the app where the same reading lives. */
  href: string;
}

/** Monthly PULSE history, the forecast band and the signals. */
export interface TrajectoryChart extends ChartBase {
  kind: 'trayectoria';
  points: PulseTrajectoryPoint[];
  boundaryIndex: number;
  signals: PulseSignal[];
}

/** One sparkline per pillar over the observed months. */
export interface PillarsChart extends ChartBase {
  kind: 'pilares';
  pillars: PulsePillarSeries[];
}

/** One variable of one month, as a bar. */
export interface VariableBar {
  key: string;
  label: string;
  pillarLabel: string;
  /** 0-100 score, `null` without evidence. */
  score: number | null;
  /** Raw figure already rendered with its unit. */
  rawText: string;
  weight: number;
  /** Points added to the PULSE of the month, `null` without evidence. */
  contribution: number | null;
  known: boolean;
}

/** The eleven variable scores of one month. */
export interface VariablesChart extends ChartBase {
  kind: 'variables';
  rows: VariableBar[];
}

/** Points earned against points available, variable by variable. */
export interface PointsChart extends ChartBase {
  kind: 'puntos';
  rows: VariableBar[];
  /** PULSE of the month, the sum of the contributions. */
  pulse: number | null;
}

/** The monthly score of one variable against its pillar and the PULSE. */
export interface VariableChart extends ChartBase {
  kind: 'variable';
  variable: PulseVariableMeta;
  pillarLabel: string;
  points: PulseVariablePoint[];
  stats: PulseVariableStats;
}

/** Decomposition of the predicted change at one horizon. */
export interface DriversChart extends ChartBase {
  kind: 'impulsores';
  horizon: number;
  targetMonth: string;
  delta: number | null;
  pulsePred: number | null;
  items: PulseContributionItem[];
}

/** Close-of-day cash of the last two months. */
export interface CashChart extends ChartBase {
  kind: 'caja';
  daily: DailyBalancePoint[];
  guide: { value: number; label: string } | null;
  mark: DailyBalancePoint | null;
}

/** One row of a ranking: a named counterparty or product and its magnitude. */
export interface RankingRow {
  id: string;
  label: string;
  value: number | null;
  /** Rendered value, with its unit. */
  valueText: string;
  /** Second reading of the row, such as the number of invoices. */
  detail: string;
  /** CSS colour of the bar; `null` uses the neutral ink. */
  color: string | null;
}

/** A ranking of counterparties, lines or debt products. */
export interface RankingChart extends ChartBase {
  kind: 'ranking';
  ranking: RankingKind;
  /** Name of the magnitude the bars compare. */
  measure: string;
  rows: RankingRow[];
}

/** One monthly series of the comparison chart. */
export interface CompareSeries {
  key: string;
  label: string;
  points: { month: string; value: number | null }[];
}

/** Two to four variable scores over the same months. */
export interface CompareChart extends ChartBase {
  kind: 'comparar';
  series: CompareSeries[];
}

export type ChartSpec =
  | TrajectoryChart
  | PillarsChart
  | VariablesChart
  | PointsChart
  | VariableChart
  | DriversChart
  | CashChart
  | RankingChart
  | CompareChart;

/** Why a chart could not be built; the model reads it and tells the user. */
export interface ChartError {
  kind: 'error';
  error: string;
}

export type ChartResult = ChartSpec | ChartError;

export type {
  ChartModelOutput,
  ChartRequest,
} from '@/lib/assistant/charts/request';
