import {
  asRecord,
  toArray,
  toNumber,
  toNumberOrNull,
  toText,
  type RawRecord,
} from '@/lib/parse-primitives';
import {
  EMPTY_EVALUATION,
  parsePulseEvaluation,
} from '@/lib/pulse/parse-evaluation';
import { toPulsePillars } from '@/lib/pulse/parse-primitives';
import type {
  PulseCompanyRow,
  PulseForecastBand,
  PulseMeta,
  PulsePillarMeta,
  PulseSummary,
  PulseVariableMeta,
} from '@/lib/pulse/types';

/** Metadata used when `summary.json` is missing, so pages render empty. */
const EMPTY_META: PulseMeta = {
  generatedFor: '',
  scoreName: 'PULSE',
  scoreExpansion: '',
  horizons: [],
  lastMonth: '',
  pillars: [],
  variables: [],
  contributionKeys: [],
  evaluation: EMPTY_EVALUATION,
};

/**
 * Normalises one pillar descriptor.
 *
 * @param value - Candidate entry of `pillars`.
 * @returns The pillar, or `null` when it carries no key.
 */
function parsePillar(value: unknown): PulsePillarMeta | null {
  const record = asRecord(value);
  const key = toText(record?.key);
  if (!record || !key) return null;
  return {
    key,
    label: toText(record.label, key),
    weight: toNumber(record.weight),
  };
}

/**
 * Normalises one variable descriptor.
 *
 * @param value - Candidate entry of `variables`.
 * @returns The variable, or `null` when it carries no key.
 */
function parseVariable(value: unknown): PulseVariableMeta | null {
  const record = asRecord(value);
  const key = toText(record?.key);
  if (!record || !key) return null;
  return {
    key,
    number: toNumber(record.number),
    label: toText(record.label, key),
    pillar: toText(record.pillar),
    weight: toNumber(record.weight),
    raw: toText(record.raw, key),
    unit: toText(record.unit),
  };
}

/**
 * Reads a forecast band, which the export sets to `null` when the model could
 * not project the company.
 *
 * @param value - Candidate `forecast_6m` object.
 * @returns The band, or `null`.
 */
export function parseBand(value: unknown): PulseForecastBand | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    pulsePred: toNumberOrNull(record.pulse_pred),
    pulseP10: toNumberOrNull(record.pulse_p10),
    pulseP90: toNumberOrNull(record.pulse_p90),
  };
}

/**
 * Normalises one portfolio row.
 *
 * @param value - Candidate entry of `companies`.
 * @returns The row, or `null` when it carries no company identifier.
 */
function parseRow(value: unknown): PulseCompanyRow | null {
  const record = asRecord(value);
  const companyId = toText(record?.company_id);
  if (!record || !companyId) return null;
  return {
    companyId,
    groupId: toText(record.group_id),
    monthsObserved: toNumber(record.months_observed),
    pulse: toNumberOrNull(record.pulse),
    pulsePrev: toNumberOrNull(record.pulse_prev),
    confidence: toNumberOrNull(record.confidence),
    pillars: toPulsePillars(record.pillars),
    forecast6m: parseBand(record.forecast_6m),
  };
}

/**
 * Reads the metadata block of the summary payload.
 *
 * @param record - Parsed summary object.
 * @returns Labels, weights, horizons and the last observed month.
 */
function parseMeta(record: RawRecord): PulseMeta {
  return {
    generatedFor: toText(record.generated_for),
    scoreName: toText(record.score_name, 'PULSE'),
    scoreExpansion: toText(record.score_expansion),
    horizons: toArray(record.horizons)
      .map((item) => toNumberOrNull(item))
      .filter((item): item is number => item !== null),
    lastMonth: toText(record.last_month),
    pillars: toArray(record.pillars)
      .map(parsePillar)
      .filter((item): item is PulsePillarMeta => item !== null),
    variables: toArray(record.variables)
      .map(parseVariable)
      .filter((item): item is PulseVariableMeta => item !== null),
    contributionKeys: toArray(record.contribution_keys).map((item) =>
      toText(item),
    ),
    evaluation: parsePulseEvaluation(record.evaluation),
  };
}

/**
 * Parses the PULSE summary, tolerating missing or malformed payloads.
 *
 * The same shape is served by `GET /api/pulse/summary` and by the bundled
 * `src/data/pulse/summary.json`, so one parser covers both sources.
 *
 * @param value - Raw payload.
 * @returns Metadata and portfolio rows; empty when the payload is unusable.
 */
export function parsePulseSummary(value: unknown): PulseSummary {
  const record = asRecord(value);
  if (!record) return { meta: EMPTY_META, companies: [] };
  return {
    meta: parseMeta(record),
    companies: toArray(record.companies)
      .map(parseRow)
      .filter((item): item is PulseCompanyRow => item !== null),
  };
}
