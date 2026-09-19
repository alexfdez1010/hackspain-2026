import {
  methodVariableDoc,
  type MethodVariableDoc,
} from '@/lib/method/variables';
import type {
  PulseCompany,
  PulseMeta,
  PulsePillarMeta,
  PulseVariableMeta,
} from '@/lib/pulse/types';
import {
  buildVariableForecast,
  type PulseVariableForecast,
} from '@/lib/pulse/variable-forecast';
import {
  buildVariableStanding,
  type PulseVariableStanding,
} from '@/lib/pulse/variable-peers';
import {
  buildVariablePoints,
  buildVariableStats,
  type PulseVariablePoint,
  type PulseVariableStats,
} from '@/lib/pulse/variable-series';

/** Everything the page of one variable of one company shows. */
export interface PulseVariableView {
  companyId: string;
  variable: PulseVariableMeta;
  pillar: PulsePillarMeta;
  /** Static documentation; `null` when the export publishes an unknown key. */
  doc: MethodVariableDoc | null;
  /** Share of the pillar's points owned by the variable, between 0 and 1. */
  shareOfPillar: number;
  /** One point per observed month, ascending. */
  points: PulseVariablePoint[];
  /** The last observed month, or `null` without history. */
  last: PulseVariablePoint | null;
  stats: PulseVariableStats;
  forecast: PulseVariableForecast;
  standing: PulseVariableStanding;
  /** The variable before and after this one in the published order. */
  previous: PulseVariableMeta | null;
  next: PulseVariableMeta | null;
}

/**
 * Finds a variable of the export by its key.
 *
 * @param meta - Score metadata.
 * @param key - Variable key such as `cash_days`.
 * @returns The variable, or `null` when the export does not publish it.
 */
export function findVariable(
  meta: PulseMeta,
  key: string,
): PulseVariableMeta | null {
  return meta.variables.find((variable) => variable.key === key) ?? null;
}

/**
 * Orders the variables as the specification numbers them.
 *
 * @param variables - Variable metadata from the export.
 * @returns A new array, lowest number first.
 */
export function orderedVariables(
  variables: readonly PulseVariableMeta[],
): PulseVariableMeta[] {
  return [...variables].sort((a, b) => a.number - b.number);
}

/**
 * Builds the page of one variable of one company.
 *
 * @param company - Company with its history and forecast.
 * @param meta - Score metadata.
 * @param variable - Variable being read.
 * @returns The view, or `null` when the pillar of the variable is unknown.
 */
export function buildVariableView(
  company: PulseCompany,
  meta: PulseMeta,
  variable: PulseVariableMeta,
): PulseVariableView | null {
  const pillar = meta.pillars.find((item) => item.key === variable.pillar);
  if (!pillar) return null;
  const points = buildVariablePoints(company.series, variable.key, pillar.key);
  const lastPoint = company.series[company.series.length - 1] ?? null;
  const ordered = orderedVariables(meta.variables);
  const index = ordered.findIndex((item) => item.key === variable.key);
  return {
    companyId: company.companyId,
    variable,
    pillar,
    doc: methodVariableDoc(variable.key),
    shareOfPillar: pillar.weight > 0 ? variable.weight / pillar.weight : 0,
    points,
    last: points[points.length - 1] ?? null,
    stats: buildVariableStats(points),
    forecast: buildVariableForecast(company.forecast, variable.key),
    standing: buildVariableStanding(
      meta.variables,
      meta.pillars,
      lastPoint,
      variable.key,
    ),
    previous: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}
