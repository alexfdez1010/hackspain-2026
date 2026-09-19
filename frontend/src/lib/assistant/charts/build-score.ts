import type {
  ChartBase,
  ChartResult,
  PillarsChart,
  PointsChart,
  TrajectoryChart,
  VariableBar,
  VariablesChart,
} from '@/lib/assistant/charts/types';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';
import { buildTrajectory, buildVariableRows } from '@/lib/pulse/company-view';
import { formatRawValue } from '@/lib/pulse/format';
import { findMonth } from '@/lib/pulse/month-view';
import { buildPillarSeries } from '@/lib/pulse/pillar-series';
import type { PulseCompany } from '@/lib/pulse/types';
import type { ToolMeta } from '@/lib/assistant/tools/context';
import { companyRoutes } from '@/lib/routes';

/** Fields every builder shares: the company, its name and the metadata. */
export interface ChartInputs {
  company: PulseCompany;
  name: string;
  meta: ToolMeta;
}

/** Pillar key to Spanish label. */
export function pillarLabels(meta: ToolMeta): Record<string, string> {
  return Object.fromEntries(meta.pillars.map((p) => [p.key, p.label]));
}

/**
 * The monthly PULSE with its forecast band and its signals.
 *
 * @param inputs - Company and metadata.
 * @returns The chart, or an error when there is no history.
 */
export function buildTrajectoryChart(inputs: ChartInputs): ChartResult {
  const { company, name } = inputs;
  const trajectory = buildTrajectory(company.series, company.forecast);
  if (trajectory.boundaryIndex < 0)
    return { kind: 'error', error: 'La empresa no tiene meses observados.' };
  const last = company.forecast.at(-1);
  const first = company.series[0];
  const base: ChartBase = {
    company: name,
    month: company.month,
    title: 'Trayectoria del PULSE',
    href: companyRoutes(company.companyId).pulse,
    summary: `PULSE de ${formatNumber(first.pulse, 1)} en ${formatMonth(first.month)} a ${formatNumber(company.pulse, 1)} en ${formatMonth(company.month)} (${company.monthsObserved} meses); previsión a ${last?.horizon ?? 0} meses ${formatNumber(last?.pulsePred ?? null, 1)} con banda ${formatNumber(last?.pulseP10 ?? null, 1)}–${formatNumber(last?.pulseP90 ?? null, 1)}; ${company.signals.length} señales marcadas.`,
  };
  const chart: TrajectoryChart = {
    ...base,
    kind: 'trayectoria',
    points: trajectory.points,
    boundaryIndex: trajectory.boundaryIndex,
    signals: company.signals,
  };
  return chart;
}

/**
 * One sparkline per pillar, heaviest first.
 *
 * @param inputs - Company and metadata.
 * @returns The chart.
 */
export function buildPillarsChart(inputs: ChartInputs): ChartResult {
  const { company, name, meta } = inputs;
  const pillars = buildPillarSeries(meta.pillars, company.series);
  const chart: PillarsChart = {
    company: name,
    month: company.month,
    kind: 'pilares',
    title: 'Los cuatro pilares mes a mes',
    href: companyRoutes(company.companyId).diagnosis,
    summary: pillars
      .map(
        (p) =>
          `${p.label} ${formatNumber(p.last, 1)} (${formatSigned(p.change, 1)} desde el primer mes)`,
      )
      .join('; '),
    pillars,
  };
  return chart;
}

/** The eleven variables of one month as chart bars. */
function variableBars(inputs: ChartInputs, month: string | undefined) {
  const { company, meta } = inputs;
  const point = findMonth(company.series, month ?? company.month);
  if (!point) return null;
  const rows: VariableBar[] = buildVariableRows(
    meta.variables,
    point,
    pillarLabels(meta),
  ).map((row) => ({
    key: row.key,
    label: row.label,
    pillarLabel: row.pillarLabel,
    score: row.score,
    rawText: formatRawValue(row.rawValue, row.unit),
    weight: row.weight,
    contribution: row.contribution,
    known: row.known,
  }));
  return { point, rows };
}

/**
 * The score of every variable in one month, strongest first.
 *
 * @param inputs - Company and metadata.
 * @param month - Month to read; the last one by default.
 * @returns The chart, or an error without history.
 */
export function buildVariablesChart(
  inputs: ChartInputs,
  month?: string,
): ChartResult {
  const built = variableBars(inputs, month);
  if (!built)
    return { kind: 'error', error: 'La empresa no tiene meses observados.' };
  const rows = [...built.rows].sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1),
  );
  const unknown = rows.filter((r) => !r.known).length;
  const chart: VariablesChart = {
    company: inputs.name,
    month: built.point.month,
    kind: 'variables',
    title: `Las once variables en ${formatMonth(built.point.month)}`,
    href: companyRoutes(inputs.company.companyId).diagnosis,
    summary: `Mejor ${rows[0]?.label} ${formatNumber(rows[0]?.score ?? null, 1)}; peor ${rows.findLast((r) => r.known)?.label} ${formatNumber(rows.findLast((r) => r.known)?.score ?? null, 1)}; ${unknown} sin datos.`,
    rows,
  };
  return chart;
}

/**
 * Points each variable earned against the points it owns, largest loss first.
 *
 * @param inputs - Company and metadata.
 * @param month - Month to read; the last one by default.
 * @returns The chart, or an error without history.
 */
export function buildPointsChart(
  inputs: ChartInputs,
  month?: string,
): ChartResult {
  const built = variableBars(inputs, month);
  if (!built)
    return { kind: 'error', error: 'La empresa no tiene meses observados.' };
  const lost = (r: VariableBar) =>
    r.known ? r.weight - (r.contribution ?? 0) : -1;
  const rows = [...built.rows].sort((a, b) => lost(b) - lost(a));
  const top = rows
    .slice(0, 3)
    .map((r) => `${r.label} pierde ${formatNumber(lost(r), 1)} de ${r.weight}`);
  const chart: PointsChart = {
    company: inputs.name,
    month: built.point.month,
    kind: 'puntos',
    title: `Puntos ganados y perdidos en ${formatMonth(built.point.month)}`,
    href: companyRoutes(inputs.company.companyId).detail,
    summary: `PULSE ${formatNumber(built.point.pulse, 1)} de 100. ${top.join('; ')}.`,
    rows,
    pulse: built.point.pulse,
  };
  return chart;
}
