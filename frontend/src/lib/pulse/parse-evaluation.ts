import {
  asRecord,
  toNumber,
  toNumberMap,
  toNumberOrNull,
} from '@/lib/parse-primitives';
import {
  EMPTY_SIGNALS_EVALUATION,
  parseSignalsEvaluation,
} from '@/lib/pulse/parse-signals';
import type {
  PulseEvaluation,
  PulseForecastHorizonEvaluation,
} from '@/lib/pulse/types';

/** Evaluation used when the export carries none. */
export const EMPTY_EVALUATION: PulseEvaluation = {
  score: {
    rows: null,
    stressRate: null,
    auroc: null,
    aurocExcludingCurrentStress: null,
    aurocTemporal: null,
    aurocByVariable: {},
  },
  forecast: [],
  risk: { rows: null, stressRate: null, auroc: null, coefficientsStd: {} },
  signals: EMPTY_SIGNALS_EVALUATION,
};

/**
 * Reads the evaluation of one forecast horizon.
 *
 * @param horizon - Horizon key of the export, such as `"6"`.
 * @param value - Candidate metrics object.
 * @returns The horizon evaluation, or `null` when the key is not a number.
 */
function parseHorizon(
  horizon: string,
  value: unknown,
): PulseForecastHorizonEvaluation | null {
  const record = asRecord(value);
  const months = toNumberOrNull(horizon);
  if (!record || months === null) return null;
  return {
    horizon: months,
    rows: toNumberOrNull(record.n),
    maePersist: toNumberOrNull(record.mae_persist),
    maeReversion: toNumberOrNull(record.mae_reversion),
    maeMl: toNumberOrNull(record.mae_ml),
    gainVsPersistPct: toNumberOrNull(record.gain_vs_persist_pct),
    gainVsReversionPct: toNumberOrNull(record.gain_vs_reversion_pct),
    directionAccuracyBigMoves: toNumberOrNull(
      record.direction_accuracy_big_moves,
    ),
    recallDeclines: toNumberOrNull(record.recall_declines),
    recallImprovements: toNumberOrNull(record.recall_improvements),
    bandCoverage: toNumberOrNull(record.band_p10_p90_coverage),
  };
}

/**
 * Parses the `evaluation` block of the PULSE summary.
 *
 * @param value - Candidate `evaluation` object.
 * @returns The published figures; empty blocks for anything missing.
 */
export function parsePulseEvaluation(value: unknown): PulseEvaluation {
  const record = asRecord(value);
  if (!record) return EMPTY_EVALUATION;
  const score = asRecord(record.score) ?? {};
  const forecast = asRecord(asRecord(record.forecast)?.horizons) ?? {};
  const risk = asRecord(record.risk) ?? {};
  return {
    score: {
      rows: toNumberOrNull(score.rows),
      stressRate: toNumberOrNull(score.stress_rate),
      auroc: toNumberOrNull(score.auroc),
      aurocExcludingCurrentStress: toNumberOrNull(
        score.auroc_excluding_current_stress,
      ),
      aurocTemporal: toNumberOrNull(score.auroc_temporal),
      aurocByVariable: toNumberMap(score.auroc_by_variable),
    },
    forecast: Object.entries(forecast)
      .map(([horizon, metrics]) => parseHorizon(horizon, metrics))
      .filter((item): item is PulseForecastHorizonEvaluation => item !== null)
      .sort((a, b) => a.horizon - b.horizon),
    risk: {
      rows: toNumberOrNull(risk.rows),
      stressRate: toNumberOrNull(risk.stress_rate),
      auroc: toNumberOrNull(risk.auroc),
      coefficientsStd: toNumberMap(risk.coefficients_std),
    },
    signals: parseSignalsEvaluation(record.signals),
  };
}

/**
 * Reads the horizon count of an evaluation, used by headings.
 *
 * @param evaluation - Parsed evaluation.
 * @returns The largest evaluated horizon, or `0` when none.
 */
export function lastEvaluatedHorizon(evaluation: PulseEvaluation): number {
  return toNumber(evaluation.forecast[evaluation.forecast.length - 1]?.horizon);
}
