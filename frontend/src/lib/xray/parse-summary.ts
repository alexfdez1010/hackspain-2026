import {
  asRecord,
  toArray,
  toNumberMap,
  toNumberOrNull,
  toStringMap,
  toText,
  toTextOrNull,
} from '@/lib/xray/parse-primitives';
import { parseCompany } from '@/lib/xray/parse';
import { parseAnticipation } from '@/lib/xray/anticipation';
import type { Alert, AlertSeverity, XraySummary } from '@/lib/xray/types';

export { parseAnticipation };

const SEVERITIES: readonly string[] = ['info', 'warning', 'critical'];

/**
 * Parses one monitor alert.
 *
 * @param value - Candidate alert object.
 * @returns The alert, or `null` when it has no company or type.
 */
export function parseAlert(value: unknown): Alert | null {
  const record = asRecord(value);
  if (!record) return null;
  const companyId = toTextOrNull(record.company_id);
  const type = toTextOrNull(record.type);
  if (!companyId || !type) return null;
  const severity = toText(record.severity, 'info');
  return {
    company_id: companyId,
    month: toText(record.month),
    type,
    severity: (SEVERITIES.includes(severity)
      ? severity
      : 'info') as AlertSeverity,
    title_es: toText(record.title_es, type),
    detail_es: toText(record.detail_es),
    score: toNumberOrNull(record.score),
    delta: toNumberOrNull(record.delta),
  };
}

/**
 * Parses the whole `summary.json` payload.
 *
 * @param value - Result of `JSON.parse` over the summary file.
 * @returns A normalised summary; unknown extra keys are ignored.
 */
export function parseSummary(value: unknown): XraySummary {
  const record = asRecord(value) ?? {};
  return {
    generated_for: toText(record.generated_for, 'Embat X-Ray'),
    pillar_labels: toStringMap(record.pillar_labels),
    feature_labels: toStringMap(record.feature_labels),
    companies: toArray(record.companies).flatMap(
      (item) => parseCompany(item) ?? [],
    ),
    alerts: toArray(record.alerts).flatMap((item) => parseAlert(item) ?? []),
    alert_counts: toNumberMap(record.alert_counts),
    anticipation: parseAnticipation(record.anticipation),
  };
}
