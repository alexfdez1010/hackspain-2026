import type { ChartInputs } from '@/lib/assistant/charts/build-score';
import { buildRankingRows } from '@/lib/assistant/charts/ranking';
import type {
  CashChart,
  ChartResult,
  DriversChart,
  RankingChart,
  RankingKind,
} from '@/lib/assistant/charts/types';
import {
  formatEuro,
  formatMonth,
  formatNumber,
  formatSigned,
} from '@/lib/format';
import { buildContributionItems } from '@/lib/pulse/company-view';
import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import { companyRoutes, companyVariableRoute } from '@/lib/routes';

/** Days of operating outflow the dashed cash reference stands for. */
const DAYS_PER_MONTH = 30;

/**
 * The drivers of the predicted change at one horizon.
 *
 * @param inputs - Company and metadata.
 * @param horizon - Horizon in months; the farthest one by default.
 * @returns The chart, or an error without forecast.
 */
export function buildDriversChart(
  inputs: ChartInputs,
  horizon: number | undefined,
): ChartResult {
  const { company, meta, name } = inputs;
  const point =
    company.forecast.find((p) => p.horizon === horizon) ??
    company.forecast.at(-1);
  if (!point) return { kind: 'error', error: 'La empresa no tiene previsión.' };
  const items = buildContributionItems(point, meta.variables);
  const chart: DriversChart = {
    company: name,
    month: company.month,
    kind: 'impulsores',
    title: `Qué mueve la previsión a ${point.horizon} meses`,
    href: companyRoutes(company.companyId).detail,
    summary: `A ${point.horizon} meses (${formatMonth(point.targetMonth)}) el PULSE previsto es ${formatNumber(point.pulsePred, 1)}, ${formatSigned(point.delta, 1)} puntos; principales impulsores: ${items
      .slice(0, 3)
      .map((i) => `${i.label} ${formatSigned(i.value, 2)}`)
      .join(', ')}.`,
    horizon: point.horizon,
    targetMonth: point.targetMonth,
    delta: point.delta,
    pulsePred: point.pulsePred,
    items,
  };
  return chart;
}

/**
 * Close-of-day cash of the last two months, against one month of outflow.
 *
 * @param inputs - Company and metadata.
 * @param details - Detail export of the company, or `null`.
 * @param variable - `cash_min` marks the worst day; anything else the outflow.
 * @returns The chart, or an error without daily balances.
 */
export function buildCashChart(
  inputs: ChartInputs,
  details: PulseCompanyDetails | null,
  variable: string | undefined,
): ChartResult {
  if (!details)
    return {
      kind: 'error',
      error: 'La caja diaria no está publicada para esta empresa.',
    };
  const worst = variable === 'cash_min';
  const block = worst
    ? details.variables.cash_min
    : details.variables.cash_days;
  if (block.daily.every((d) => d.balance === null))
    return {
      kind: 'error',
      error: 'Sin saldos diarios en los dos últimos meses.',
    };
  const outflow = details.variables.cash_days.dailyOutflow;
  const guide =
    outflow === null
      ? null
      : { value: outflow * DAYS_PER_MONTH, label: 'un mes de salidas' };
  const mark = worst ? details.variables.cash_min.minDay : null;
  const last = block.daily.at(-1);
  const chart: CashChart = {
    company: inputs.name,
    month: details.month,
    kind: 'caja',
    title: worst
      ? 'Caja diaria y peor día del mes'
      : 'Caja diaria de los dos últimos meses',
    href: companyVariableRoute(
      inputs.company.companyId,
      worst ? 'cash_min' : 'cash_days',
    ),
    summary: `Saldo al cierre ${formatEuro(last?.balance ?? null)}${guide ? `, frente a ${formatEuro(guide.value)} de salidas al mes` : ''}${mark ? `; peor día ${mark.day} con ${formatEuro(mark.balance)}` : ''}.`,
    daily: block.daily,
    guide,
    mark,
  };
  return chart;
}

/**
 * A ranking of counterparties, lines, debt products or aging buckets.
 *
 * @param inputs - Company and metadata.
 * @param details - Detail export of the company, or `null`.
 * @param ranking - Ranking to draw.
 * @returns The chart, or an error when the block is empty.
 */
export function buildRankingChart(
  inputs: ChartInputs,
  details: PulseCompanyDetails | null,
  ranking: RankingKind | undefined,
): ChartResult {
  if (!ranking) return { kind: 'error', error: 'Indica qué ranking dibujar.' };
  if (!details)
    return {
      kind: 'error',
      error: 'El detalle de las variables no está publicado para esta empresa.',
    };
  const built = buildRankingRows(details, ranking);
  if (built.rows.length === 0)
    return {
      kind: 'error',
      error: `No hay filas para «${built.measure}» en esta empresa.`,
    };
  const chart: RankingChart = {
    company: inputs.name,
    month: details.month,
    kind: 'ranking',
    title: built.measure,
    href: companyRoutes(inputs.company.companyId).detail,
    summary: `${built.rows.length} filas; primero ${built.rows[0].label} con ${built.rows[0].valueText}${built.rows[1] ? `, después ${built.rows[1].label} con ${built.rows[1].valueText}` : ''}.`,
    ranking,
    measure: built.measure,
    rows: built.rows,
  };
  return chart;
}
