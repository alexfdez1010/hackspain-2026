import {
  asRecord,
  toArray,
  toNumber,
  toNumberOrNull,
  toText,
} from '@/lib/parse-primitives';
import type {
  PulseAnticipationHorizon,
  PulsePersistenceEvaluation,
  PulseSignal,
  PulseSignalDriver,
  PulseSignalKind,
  PulseSignalsEvaluation,
} from '@/lib/pulse/types';

const KINDS: readonly PulseSignalKind[] = [
  'caida',
  'bache',
  'mejora',
  'repunte',
];

/** Signals evaluation used when the export carries none. */
export const EMPTY_SIGNALS_EVALUATION: PulseSignalsEvaluation = {
  anticipation: [],
  persistence: {
    down: { signals: null, persistentShare: null, auroc: null },
    up: { signals: null, persistentShare: null, auroc: null },
  },
};

/**
 * Reads the pillars that moved with the score.
 *
 * @param value - Candidate `drivers` array.
 * @returns The drivers that name a pillar and a delta.
 */
function parseDrivers(value: unknown): PulseSignalDriver[] {
  return toArray(value)
    .map((item) => {
      const record = asRecord(item);
      const pillar = toText(record?.pillar);
      const delta = toNumberOrNull(record?.delta);
      if (!record || !pillar || delta === null) return null;
      return { pillar, label: toText(record.label, pillar), delta };
    })
    .filter((item): item is PulseSignalDriver => item !== null);
}

/**
 * Reads the per-pillar moves, keeping `null` where the pillar was unknown.
 *
 * @param value - Candidate `pillar_deltas` object.
 * @returns Pillar key to points moved.
 */
function parsePillarDeltas(value: unknown): Record<string, number | null> {
  const record = asRecord(value) ?? {};
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [key, toNumberOrNull(item)]),
  );
}

/**
 * Normalises one signal, tolerating missing figures.
 *
 * @param value - Candidate entry of `signals`.
 * @returns The signal, or `null` when it carries no month or an unknown kind.
 */
function parseSignal(value: unknown): PulseSignal | null {
  const record = asRecord(value);
  const month = toText(record?.month);
  const kind = toText(record?.kind) as PulseSignalKind;
  if (!record || !month || !KINDS.includes(kind)) return null;
  const outcome = toText(record.outcome);
  return {
    month,
    kind,
    direction: toText(record.direction) === 'up' ? 'up' : 'down',
    level: toNumberOrNull(record.level),
    baseline: toNumberOrNull(record.baseline),
    move: toNumberOrNull(record.move),
    breadth: toNumber(record.breadth),
    confidence: toNumberOrNull(record.confidence),
    pillarDeltas: parsePillarDeltas(record.pillar_deltas),
    drivers: parseDrivers(record.drivers),
    pPersistent: toNumberOrNull(record.p_persistent),
    outcome:
      outcome === 'persistente' || outcome === 'transitorio' ? outcome : null,
    headline: toText(record.headline),
    detail: toText(record.detail),
  };
}

/**
 * Parses the `signals` array of a company payload.
 *
 * @param value - Candidate array.
 * @returns The signals, oldest first.
 */
export function parseSignals(value: unknown): PulseSignal[] {
  return toArray(value)
    .map(parseSignal)
    .filter((item): item is PulseSignal => item !== null)
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Reads the anticipation figures of one horizon.
 *
 * @param horizon - Horizon key of the export, such as `"6"`.
 * @param value - Candidate metrics object.
 * @returns The horizon, or `null` when the key is not a number.
 */
function parseAnticipation(
  horizon: string,
  value: unknown,
): PulseAnticipationHorizon | null {
  const record = asRecord(value);
  const months = toNumberOrNull(horizon);
  if (!record || months === null) return null;
  return {
    horizon: months,
    rows: toNumberOrNull(record.rows),
    baseRate: toNumberOrNull(record.base_rate),
    auroc: toNumberOrNull(record.auroc),
    alertShare: toNumberOrNull(record.alert_share),
    recall: toNumberOrNull(record.recall),
    precision: toNumberOrNull(record.precision),
    lift: toNumberOrNull(record.lift),
  };
}

/**
 * Reads the persistence-model figures of one direction.
 *
 * @param value - Candidate metrics object.
 * @returns The figures; `null` fields when missing.
 */
function parsePersistence(value: unknown): PulsePersistenceEvaluation {
  const record = asRecord(value) ?? {};
  return {
    signals: toNumberOrNull(record.signals),
    persistentShare: toNumberOrNull(record.persistent_share),
    auroc: toNumberOrNull(record.oof_auroc),
  };
}

/**
 * Parses the `evaluation.signals` block of the PULSE summary.
 *
 * @param value - Candidate object.
 * @returns The anticipation curve and the persistence figures.
 */
export function parseSignalsEvaluation(value: unknown): PulseSignalsEvaluation {
  const record = asRecord(value);
  if (!record) return EMPTY_SIGNALS_EVALUATION;
  const horizons = asRecord(asRecord(record.anticipation)?.horizons) ?? {};
  const persistence = asRecord(record.persistence) ?? {};
  return {
    anticipation: Object.entries(horizons)
      .map(([horizon, metrics]) => parseAnticipation(horizon, metrics))
      .filter((item): item is PulseAnticipationHorizon => item !== null)
      .sort((a, b) => a.horizon - b.horizon),
    persistence: {
      down: parsePersistence(persistence.down),
      up: parsePersistence(persistence.up),
    },
  };
}
