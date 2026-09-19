import { asRecord, toNumberOrNull } from '@/lib/xray/parse-primitives';
import type {
  PulseContributions,
  PulsePillars,
  PulseVariableValue,
} from '@/lib/pulse/types';

/**
 * Reads the pillar scores of a month, keeping `null` for missing evidence.
 *
 * Pillar keys come from the dataset, so no fixed list is assumed here.
 *
 * @param value - Candidate `pillars` object.
 * @returns A map from pillar key to score.
 */
export function toPulsePillars(value: unknown): PulsePillars {
  const record = asRecord(value);
  if (!record) return {};
  const pillars: PulsePillars = {};
  for (const [key, item] of Object.entries(record)) {
    pillars[key] = toNumberOrNull(item);
  }
  return pillars;
}

/**
 * Reads the contribution points of a month or of a forecast horizon.
 *
 * Non-numeric entries are dropped so the sum stays comparable with `delta_raw`.
 *
 * @param value - Candidate `contributions` object.
 * @returns A map from contribution key to points.
 */
export function toPulseContributions(value: unknown): PulseContributions {
  const record = asRecord(value);
  if (!record) return {};
  const contributions: PulseContributions = {};
  for (const [key, item] of Object.entries(record)) {
    const points = toNumberOrNull(item);
    if (points !== null) contributions[key] = points;
  }
  return contributions;
}

/**
 * Reads the per-variable scores of a month.
 *
 * A variable is only considered known when the export says so *and* it carries
 * a score, so the UI never renders an unknown variable as a zero.
 *
 * @param value - Candidate `variables` object.
 * @returns A map from variable key to its score, raw figure and availability.
 */
export function toPulseVariables(
  value: unknown,
): Record<string, PulseVariableValue> {
  const record = asRecord(value);
  if (!record) return {};
  const variables: Record<string, PulseVariableValue> = {};
  for (const [key, item] of Object.entries(record)) {
    const entry = asRecord(item);
    const score = toNumberOrNull(entry?.score);
    variables[key] = {
      score,
      raw: toNumberOrNull(entry?.raw),
      known: entry?.known === true && score !== null,
    };
  }
  return variables;
}
