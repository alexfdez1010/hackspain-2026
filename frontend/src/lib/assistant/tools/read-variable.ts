import {
  isLoadError,
  round,
  type ToolRuntime,
} from '@/lib/assistant/tools/context';
import { buildRankingRows } from '@/lib/assistant/charts/ranking';
import { RANKING_KINDS, type RankingKind } from '@/lib/assistant/charts/types';
import { counterpartyName } from '@/lib/company/names';
import type { PulseVariableDetails } from '@/lib/pulse/details/types';
import { buildVariableForecast } from '@/lib/pulse/variable-forecast';
import {
  buildVariablePoints,
  buildVariableStats,
} from '@/lib/pulse/variable-series';
import { variableByKey } from '@/lib/assistant/charts/build-variable';

/** Text returned when the key is not one of the eleven variables. */
export function unknownVariableError(runtime: ToolRuntime): string {
  const keys = runtime.meta.variables.map((item) => item.key).join(', ');
  return `Variable desconocida. Las claves válidas son: ${keys}.`;
}

/**
 * Reads the history of one variable, its stats and its weight in the forecast.
 *
 * @param runtime - Tool runtime of the request.
 * @param input - Variable key of the export.
 * @returns One point per month, the stats and the forecast impact.
 */
export async function readVariable(
  runtime: ToolRuntime,
  input: { variable: string },
) {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return loaded;
  const variable = variableByKey(runtime.meta, input.variable);
  if (!variable) return { error: unknownVariableError(runtime) };
  const pillar = runtime.meta.pillars.find((p) => p.key === variable.pillar);
  const points = buildVariablePoints(
    loaded.company.series,
    variable.key,
    variable.pillar,
  );
  const stats = buildVariableStats(points);
  const forecast = buildVariableForecast(loaded.company.forecast, variable.key);
  return {
    company: loaded.name,
    variable: {
      key: variable.key,
      label: variable.label,
      pillar: pillar?.label ?? variable.pillar,
      weight: variable.weight,
      unit: variable.unit,
    },
    months: points.map((point) => ({
      month: point.month,
      score: round(point.score),
      raw: round(point.raw, 2),
      contribution: round(point.contribution),
      pillarScore: round(point.pillarScore),
      pulse: round(point.pulse),
    })),
    stats: {
      monthsWithData: stats.known,
      monthsObserved: stats.total,
      mean: round(stats.mean),
      best: stats.best,
      worst: stats.worst,
      trend: round(stats.trend),
      rawMean: round(stats.rawMean, 2),
      meanContribution: round(stats.meanContribution),
    },
    forecastImpact: {
      peak: forecast.peak
        ? {
            horizon: forecast.peak.horizon,
            points: round(forecast.peak.points, 2),
          }
        : null,
      atFarthest: forecast.farthest
        ? {
            horizon: forecast.farthest.horizon,
            points: round(forecast.farthest.points, 2),
            rank: forecast.rankAtFarthest,
            drivers: forecast.driverCount,
          }
        : null,
    },
  };
}

/** Which rankings each variable's detail block can answer. */
const RANKINGS_BY_VARIABLE: Partial<
  Record<keyof PulseVariableDetails, RankingKind[]>
> = {
  dso: ['clientes_dso', 'clientes_cobros'],
  dpo: ['proveedores_dpo', 'proveedores_pagos'],
  terms: ['proveedores_pagos'],
  ar90: ['morosidad', 'antiguedad'],
  top_client: ['concentracion'],
  loc_util: ['lineas'],
  loc_accel: ['lineas'],
  maturities: ['deuda'],
  network: ['red'],
};

/**
 * Reads the detail behind one variable: rankings of counterparties, lines,
 * debt products or aging, and the recent months of the block.
 *
 * @param runtime - Tool runtime of the request.
 * @param input - Variable key, or a ranking name directly.
 * @returns The rankings the block answers, rows named and rounded.
 */
export async function readVariableDetail(
  runtime: ToolRuntime,
  input: { variable?: string; ranking?: RankingKind },
) {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return loaded;
  const details = await runtime.loadDetails();
  if (!details) {
    return {
      error: 'El detalle de las variables no está publicado para esta empresa.',
    };
  }
  const variableKey = input.variable as keyof PulseVariableDetails | undefined;
  const rankings: RankingKind[] = input.ranking
    ? [input.ranking]
    : variableKey
      ? (RANKINGS_BY_VARIABLE[variableKey] ?? [])
      : [];
  if (rankings.length === 0) {
    return {
      error: `Indica un ranking: ${RANKING_KINDS.join(', ')}; o una variable con detalle: ${Object.keys(RANKINGS_BY_VARIABLE).join(', ')}.`,
    };
  }
  const cash =
    variableKey === 'cash_days' || variableKey === 'cash_min'
      ? details.variables[variableKey]
      : null;
  return {
    company: loaded.name,
    month: details.month,
    rankings: rankings.map((ranking) => {
      const built = buildRankingRows(details, ranking);
      return {
        ranking,
        measure: built.measure,
        rows: built.rows.map((row) => ({
          name: row.label,
          value: row.valueText,
          detail: row.detail,
        })),
      };
    }),
    dailyCash: cash
      ? {
          days: cash.daily.length,
          minDay: 'minDay' in cash ? cash.minDay : null,
          lastBalance: round(cash.daily.at(-1)?.balance ?? null, 0),
          accounts:
            'accounts' in cash
              ? cash.accounts.map((a) => ({
                  bank: a.bank,
                  label: a.label,
                  balance: round(a.balance, 0),
                }))
              : undefined,
        }
      : undefined,
    counterpartyNote: `Los nombres de contrapartes son estables: ${counterpartyName('COUNTERPARTY_00001')} es un ejemplo.`,
  };
}
