import {
  pillarLabels,
  type ChartInputs,
} from '@/lib/assistant/charts/build-score';
import type {
  ChartResult,
  CompareChart,
  VariableChart,
} from '@/lib/assistant/charts/types';
import type { ToolMeta } from '@/lib/assistant/tools/context';
import { formatNumber, formatSigned } from '@/lib/format';
import type { PulseVariableMeta } from '@/lib/pulse/types';
import {
  buildVariablePoints,
  buildVariableStats,
} from '@/lib/pulse/variable-series';
import { companyRoutes, companyVariableRoute } from '@/lib/routes';

/**
 * Finds one of the eleven variables by its key.
 *
 * @param meta - Pillars and variables of the export.
 * @param key - Variable key such as `cash_days`.
 * @returns The variable, or `null` when the key is unknown.
 */
export function variableByKey(
  meta: ToolMeta,
  key: string | undefined,
): PulseVariableMeta | null {
  return meta.variables.find((variable) => variable.key === key) ?? null;
}

/**
 * The monthly score of one variable against its pillar and the PULSE.
 *
 * @param inputs - Company and metadata.
 * @param key - Variable key.
 * @returns The chart, or an error for an unknown key.
 */
export function buildVariableChart(
  inputs: ChartInputs,
  key: string | undefined,
): ChartResult {
  const variable = variableByKey(inputs.meta, key);
  if (!variable)
    return { kind: 'error', error: 'Indica una de las once variables.' };
  const points = buildVariablePoints(
    inputs.company.series,
    variable.key,
    variable.pillar,
  );
  const stats = buildVariableStats(points);
  const chart: VariableChart = {
    company: inputs.name,
    month: inputs.company.month,
    kind: 'variable',
    title: `${variable.label}, mes a mes`,
    href: companyVariableRoute(inputs.company.companyId, variable.key),
    summary: `${variable.label}: último score ${formatNumber(points.at(-1)?.score ?? null, 1)}, media ${formatNumber(stats.mean, 1)}, tendencia ${formatSigned(stats.trend, 1)} en ${stats.known} meses con datos.`,
    variable,
    pillarLabel: pillarLabels(inputs.meta)[variable.pillar] ?? variable.pillar,
    points,
    stats,
  };
  return chart;
}

/**
 * Two to four variable scores on the same months.
 *
 * @param inputs - Company and metadata.
 * @param keys - Variable keys.
 * @returns The chart, or an error when the keys are not two to four.
 */
export function buildCompareChart(
  inputs: ChartInputs,
  keys: string[] | undefined,
): ChartResult {
  const variables = (keys ?? [])
    .map((k) => variableByKey(inputs.meta, k))
    .filter((v) => v !== null);
  if (variables.length < 2 || variables.length > 4)
    return {
      kind: 'error',
      error: 'Indica entre dos y cuatro variables válidas.',
    };
  const series = variables.map((variable) => ({
    key: variable.key,
    label: variable.label,
    points: buildVariablePoints(
      inputs.company.series,
      variable.key,
      variable.pillar,
    ).map((p) => ({ month: p.month, value: p.score })),
  }));
  const chart: CompareChart = {
    company: inputs.name,
    month: inputs.company.month,
    kind: 'comparar',
    title: `${series
      .slice(0, -1)
      .map((s) => s.label)
      .join(', ')} y ${series.at(-1)?.label}`,
    href: companyRoutes(inputs.company.companyId).diagnosis,
    summary: series
      .map(
        (s) => `${s.label} ${formatNumber(s.points.at(-1)?.value ?? null, 1)}`,
      )
      .join('; '),
    series,
  };
  return chart;
}
