import {
  asRecord,
  toArray,
  toNumberMap,
  toNumberOrNull,
  toStringMap,
  toText,
} from '@/lib/xray/parse-primitives';

/**
 * How early the early-warning alerts fire before a stress episode.
 *
 * Field names are normalised to camel case; every measure is optional because
 * the ML service may publish a partial block.
 */
export interface LeadTime {
  nEvents: number | null;
  nEventsAlerted: number | null;
  shareEventsAlerted: number | null;
  medianLeadMonths: number | null;
  meanLeadMonths: number | null;
  p25LeadMonths: number | null;
  p75LeadMonths: number | null;
  /** Months of anticipation to number of events. */
  leadHistogram: Record<string, number>;
  /** Horizon key (`h1`…`h6`) to share of events warned that early. */
  detectionRate: Record<string, number>;
  /** Alert type to number of events it warned. */
  byAlertType: Record<string, number>;
}

/** Cost of the monitor: alerts that were not followed by an event. */
export interface FalseAlarms {
  alertsEvaluated: number | null;
  falseAlarms: number | null;
  falseAlarmShare: number | null;
  perCompanyMonth: number | null;
}

/** Mean score at a given distance from the event, in months. */
export interface ScorePoint {
  offset: number;
  n: number | null;
  meanScore: number | null;
}

/** Discrimination of the score at one horizon. */
export interface AurocPoint {
  horizon: string;
  auroc: number;
  n: number | null;
  positives: number | null;
}

/** Normalised anticipation evidence. */
export interface Anticipation {
  leadTime: LeadTime | null;
  falseAlarms: FalseAlarms | null;
  scoreCurve: ScorePoint[];
  populationMeanScore: number | null;
  aurocOof: AurocPoint[];
  aurocInSample: AurocPoint[];
  earlyWarningTypes: string[];
  lookbackMonths: number | null;
  /** Spanish definitions of each measure, shown next to the figures. */
  definitions: Record<string, string>;
}

/** An anticipation block with nothing in it, used when the service publishes none. */
export const EMPTY_ANTICIPATION: Anticipation = {
  leadTime: null,
  falseAlarms: null,
  scoreCurve: [],
  populationMeanScore: null,
  aurocOof: [],
  aurocInSample: [],
  earlyWarningTypes: [],
  lookbackMonths: null,
  definitions: {},
};

/**
 * Parses the `{h1: {auroc, n, positives}}` maps into an ordered list.
 *
 * @param value - Candidate AUROC map.
 * @returns One point per horizon, ordered by the horizon number.
 */
function parseAuroc(value: unknown): AurocPoint[] {
  const record = asRecord(value) ?? {};
  return Object.entries(record)
    .flatMap(([horizon, item]) => {
      const entry = asRecord(item);
      const auroc = toNumberOrNull(entry ? entry.auroc : item);
      if (auroc === null) return [];
      return [
        {
          horizon,
          auroc,
          n: entry ? toNumberOrNull(entry.n) : null,
          positives: entry ? toNumberOrNull(entry.positives) : null,
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(a.horizon.replace(/\D/g, '')) -
        Number(b.horizon.replace(/\D/g, '')),
    );
}

/**
 * Parses the lead-time block.
 *
 * @param value - Candidate lead-time object.
 * @returns The normalised block, or `null` when it is absent.
 */
function parseLeadTime(value: unknown): LeadTime | null {
  const record = asRecord(value);
  if (!record) return null;
  return {
    nEvents: toNumberOrNull(record.n_events),
    nEventsAlerted: toNumberOrNull(record.n_events_alerted),
    shareEventsAlerted: toNumberOrNull(record.share_events_alerted),
    medianLeadMonths: toNumberOrNull(record.median_lead_months),
    meanLeadMonths: toNumberOrNull(record.mean_lead_months),
    p25LeadMonths: toNumberOrNull(record.p25_lead_months),
    p75LeadMonths: toNumberOrNull(record.p75_lead_months),
    leadHistogram: toNumberMap(record.lead_histogram),
    detectionRate: toNumberMap(record.detection_rate),
    byAlertType: toNumberMap(record.by_alert_type),
  };
}

/**
 * Parses the anticipation block of `summary.json`, tolerating absent measures.
 *
 * @param value - Candidate anticipation object.
 * @returns The normalised anticipation evidence.
 */
export function parseAnticipation(value: unknown): Anticipation {
  const record = asRecord(value);
  if (!record) return EMPTY_ANTICIPATION;
  const falseAlarms = asRecord(record.false_alarms);
  return {
    leadTime: parseLeadTime(record.lead_time),
    falseAlarms: falseAlarms
      ? {
          alertsEvaluated: toNumberOrNull(falseAlarms.alerts_evaluated),
          falseAlarms: toNumberOrNull(falseAlarms.false_alarms),
          falseAlarmShare: toNumberOrNull(falseAlarms.false_alarm_share),
          perCompanyMonth: toNumberOrNull(falseAlarms.per_company_month),
        }
      : null,
    scoreCurve: toArray(record.score_by_months_to_event)
      .flatMap((item) => {
        const point = asRecord(item);
        const offset = point ? toNumberOrNull(point.offset) : null;
        if (offset === null) return [];
        return [
          {
            offset,
            n: toNumberOrNull(point?.n),
            meanScore: toNumberOrNull(point?.mean_score),
          },
        ];
      })
      .sort((a, b) => a.offset - b.offset),
    populationMeanScore: toNumberOrNull(record.population_mean_score),
    aurocOof: parseAuroc(record.auroc_oof),
    aurocInSample: parseAuroc(record.auroc_in_sample),
    earlyWarningTypes: toArray(record.early_warning_types)
      .map((item) => toText(item))
      .filter((item) => item !== ''),
    lookbackMonths: toNumberOrNull(record.lookback_months),
    definitions: toStringMap(record.definitions_es),
  };
}
