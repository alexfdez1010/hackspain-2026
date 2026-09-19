import {
  isLoadError,
  round,
  type ToolRuntime,
} from '@/lib/assistant/tools/context';
import { buildVariableRows } from '@/lib/pulse/company-view';
import { findMonth } from '@/lib/pulse/month-view';
import { activeSignal, describeSignalStatus } from '@/lib/pulse/signals';
import type { PulseForecastPoint, PulseSeriesPoint } from '@/lib/pulse/types';

/** Most months a history tool returns; the export never exceeds it. */
const MAX_MONTHS = 24;

/** Pillar scores rounded for the model. */
function roundedPillars(point: PulseSeriesPoint | PulseForecastPoint | null) {
  if (!point || !('pillars' in point)) return {};
  return Object.fromEntries(
    Object.entries(point.pillars).map(([key, value]) => [key, round(value)]),
  );
}

/**
 * Reads the monthly PULSE history of the company.
 *
 * @param runtime - Tool runtime of the request.
 * @param input - How many trailing months to return.
 * @returns The months, oldest first, with score, confidence and pillars.
 */
export async function readHistory(
  runtime: ToolRuntime,
  input: { months?: number },
) {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return loaded;
  const count = Math.min(Math.max(input.months ?? MAX_MONTHS, 1), MAX_MONTHS);
  const series = loaded.company.series.slice(-count);
  return {
    company: loaded.name,
    monthsObserved: loaded.company.monthsObserved,
    pillarLabels: Object.fromEntries(
      runtime.meta.pillars.map((pillar) => [pillar.key, pillar.label]),
    ),
    months: series.map((point) => ({
      month: point.month,
      pulse: round(point.pulse),
      confidence: round(point.confidence, 2),
      cashEnd: round(point.cashEnd, 0),
      pillars: roundedPillars(point),
    })),
  };
}

/**
 * Reads the eleven variables of one observed month.
 *
 * @param runtime - Tool runtime of the request.
 * @param input - Month to read; the last observed one by default.
 * @returns Score, raw figure, unit, weight and contribution of every variable.
 */
export async function readMonth(
  runtime: ToolRuntime,
  input: { month?: string },
) {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return loaded;
  const { company, name } = loaded;
  const point = findMonth(company.series, input.month ?? company.month);
  if (!point) return { error: 'La empresa no tiene meses observados.' };
  const labels = Object.fromEntries(
    runtime.meta.pillars.map((pillar) => [pillar.key, pillar.label]),
  );
  const rows = buildVariableRows(runtime.meta.variables, point, labels);
  return {
    company: name,
    month: point.month,
    requestedMonthFound: !input.month || point.month === input.month,
    pulse: round(point.pulse),
    confidence: round(point.confidence, 2),
    pillars: roundedPillars(point),
    variables: rows.map((row) => ({
      key: row.key,
      label: row.label,
      pillar: row.pillarLabel,
      weight: row.weight,
      score: round(row.score),
      raw: round(row.rawValue, 2),
      unit: row.unit,
      contribution: round(row.contribution),
      known: row.known,
    })),
  };
}

/**
 * Reads the forecast horizons and what drives each predicted change.
 *
 * @param runtime - Tool runtime of the request.
 * @returns One entry per horizon with its band and its three main drivers.
 */
export async function readForecast(runtime: ToolRuntime) {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return loaded;
  const labels = new Map(
    runtime.meta.variables.map((item) => [item.key, item.label]),
  );
  return {
    company: loaded.name,
    lastObservedMonth: loaded.company.month,
    pulse: round(loaded.company.pulse),
    horizons: loaded.company.forecast.map((point) => ({
      horizon: point.horizon,
      targetMonth: point.targetMonth,
      pulsePred: round(point.pulsePred),
      pulseP10: round(point.pulseP10),
      pulseP90: round(point.pulseP90),
      delta: round(point.delta),
      topDrivers: Object.entries(point.contributions)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 4)
        .map(([key, value]) => ({
          driver: labels.get(key) ?? key,
          points: round(value, 2),
        })),
    })),
  };
}

/**
 * Reads the signals of the company and the alert the page shows.
 *
 * @param runtime - Tool runtime of the request.
 * @returns The signals, oldest first, and the active one.
 */
export async function readSignals(runtime: ToolRuntime) {
  const loaded = await runtime.loadCompany();
  if (isLoadError(loaded)) return loaded;
  const { company, name } = loaded;
  const active = activeSignal(company);
  return {
    company: name,
    activeAlert: active
      ? { headline: active.headline, status: describeSignalStatus(active) }
      : null,
    signals: company.signals.map((signal) => ({
      month: signal.month,
      kind: signal.kind,
      move: round(signal.move),
      level: round(signal.level),
      baseline: round(signal.baseline),
      drivers: signal.drivers.map((d) => `${d.label} ${round(d.delta)}`),
      pPersistent: round(signal.pPersistent, 2),
      outcome: signal.outcome,
      detail: signal.detail,
    })),
  };
}
