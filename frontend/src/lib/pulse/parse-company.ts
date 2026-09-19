import {
  asRecord,
  toArray,
  toNumber,
  toNumberOrNull,
  toText,
} from '@/lib/parse-primitives';
import {
  toPulseContributions,
  toPulsePillars,
  toPulseVariables,
} from '@/lib/pulse/parse-primitives';
import { parseBand } from '@/lib/pulse/parse-summary';
import type {
  PulseCompany,
  PulseForecastPoint,
  PulseSeriesPoint,
} from '@/lib/pulse/types';

/**
 * Normalises one observed month.
 *
 * @param value - Candidate entry of `series`.
 * @returns The month, or `null` when it carries no month key.
 */
function parseSeriesPoint(value: unknown): PulseSeriesPoint | null {
  const record = asRecord(value);
  const month = toText(record?.month);
  if (!record || !month) return null;
  return {
    month,
    pulse: toNumberOrNull(record.pulse),
    pulseRaw: toNumberOrNull(record.pulse_raw),
    confidence: toNumberOrNull(record.confidence),
    pillars: toPulsePillars(record.pillars),
    variables: toPulseVariables(record.variables),
    contributions: toPulseContributions(record.contributions),
    cashEnd: toNumberOrNull(record.cash_end),
  };
}

/**
 * Normalises one forecast horizon with its decomposition.
 *
 * @param value - Candidate entry of `forecast`.
 * @returns The horizon, or `null` when it carries no target month.
 */
function parseForecastPoint(value: unknown): PulseForecastPoint | null {
  const record = asRecord(value);
  const targetMonth = toText(record?.target_month);
  if (!record || !targetMonth) return null;
  const band = parseBand(record) ?? {
    pulsePred: null,
    pulseP10: null,
    pulseP90: null,
  };
  return {
    ...band,
    horizon: toNumber(record.horizon),
    targetMonth,
    deltaRaw: toNumberOrNull(record.delta_raw),
    contributions: toPulseContributions(record.contributions),
  };
}

/**
 * Parses one company payload, tolerating missing or malformed fields.
 *
 * The same shape is served by `GET /api/pulse/companies/{id}` and by the
 * bundled `src/data/pulse/companies/<id>.json`.
 *
 * @param value - Raw payload.
 * @returns The company with its history and forecast, or `null` when the
 * payload carries no company identifier.
 */
export function parsePulseCompany(value: unknown): PulseCompany | null {
  const record = asRecord(value);
  const companyId = toText(record?.company_id);
  if (!record || !companyId) return null;
  const series = toArray(record.series)
    .map(parseSeriesPoint)
    .filter((item): item is PulseSeriesPoint => item !== null)
    .sort((a, b) => a.month.localeCompare(b.month));
  const forecast = toArray(record.forecast)
    .map(parseForecastPoint)
    .filter((item): item is PulseForecastPoint => item !== null)
    .sort((a, b) => a.horizon - b.horizon);
  return {
    companyId,
    groupId: toText(record.group_id),
    monthsObserved: toNumber(record.months_observed, series.length),
    month: toText(record.month, series[series.length - 1]?.month ?? ''),
    pulse: toNumberOrNull(record.pulse),
    pulsePrev: toNumberOrNull(record.pulse_prev),
    confidence: toNumberOrNull(record.confidence),
    pillars: toPulsePillars(record.pillars),
    series,
    forecast,
  };
}
