import type { MonthRecord, Regime } from '@/lib/xray/types';

/** Commercial state of a working-capital line. */
export type OfferStatus = 'preaprobada' | 'en vigilancia' | 'cerrada';

/** Everything the pricing rules need from a company. */
export interface OfferInput {
  /** Current X-Ray score, 0-100. */
  score: number;
  /** Probability of stress in the next six months, 0-1. */
  p_stress: number;
  /** Detected regime; it widens or tightens the multiplier. */
  regime: Regime;
  /** Average monthly bank inflow in euros. */
  avgMonthlyInflow: number;
}

/** A pre-approved revolving line, priced from the score. */
export interface Offer {
  /** Base multiplier implied by the score band. */
  baseMultiplier: number;
  /** Multiplier after the regime adjustment, capped at 1. */
  multiplier: number;
  /** Approved limit in euros, capped at 2.000.000 €. */
  limit: number;
  /** Price over the reference rate, in basis points. */
  spread_bps: number;
  /** Commercial state driving what the client can do with the line. */
  status: OfferStatus;
}

/** Hard ceiling of the programme, in euros. */
export const MAX_LIMIT = 2_000_000;

/**
 * Maps a score to the share of one month of inflow that can be lent.
 *
 * @param score - X-Ray score, 0-100.
 * @returns A multiplier between 0 and 1.
 */
export function scoreMultiplier(score: number): number {
  if (!Number.isFinite(score) || score < 35) return 0;
  if (score < 50) return 0.25;
  if (score < 65) return 0.5;
  if (score < 80) return 0.8;
  return 1;
}

/**
 * Applies the regime adjustment: a structural decline halves the line before
 * the default shows up, a structural improvement widens it by 15 %.
 *
 * @param multiplier - Base multiplier from the score band.
 * @param regime - Detected regime.
 * @returns The adjusted multiplier, never above 1.
 */
export function regimeAdjustedMultiplier(
  multiplier: number,
  regime: Regime,
): number {
  if (regime === 'structural_decline') return multiplier * 0.5;
  if (regime === 'structural_improvement')
    return Math.min(multiplier * 1.15, 1);
  return multiplier;
}

/**
 * Prices the line over the reference rate from the stress probability.
 *
 * @param pStress - Probability of stress in the next six months, 0-1.
 * @returns The spread in basis points, from 250 to 1450.
 */
export function spreadBps(pStress: number): number {
  const bounded = Math.min(
    Math.max(Number.isFinite(pStress) ? pStress : 1, 0),
    1,
  );
  return 250 + Math.round(1200 * bounded);
}

/**
 * Decides the commercial state of the line.
 *
 * @param score - X-Ray score, 0-100.
 * @param pStress - Probability of stress in the next six months, 0-1.
 * @returns `preaprobada`, `en vigilancia` or `cerrada`.
 */
export function offerStatus(score: number, pStress: number): OfferStatus {
  if (score >= 50 && pStress < 0.35) return 'preaprobada';
  if ((score >= 35 && score < 50) || (pStress >= 0.35 && pStress <= 0.6)) {
    return 'en vigilancia';
  }
  return 'cerrada';
}

/**
 * Computes the pre-approved revolving working-capital line for a company.
 *
 * The limit follows the score band, is adjusted by the detected regime and is
 * capped at {@link MAX_LIMIT}. The price follows the stress probability, so it
 * reacts before any payment incident is visible.
 *
 * @param company - Score, stress probability, regime and average inflow.
 * @returns The limit, the spread and the commercial state of the line.
 */
export function computeOffer(company: OfferInput): Offer {
  const baseMultiplier = scoreMultiplier(company.score);
  const multiplier = regimeAdjustedMultiplier(baseMultiplier, company.regime);
  const inflow = Number.isFinite(company.avgMonthlyInflow)
    ? Math.max(company.avgMonthlyInflow, 0)
    : 0;
  const limit = Math.min(Math.max(multiplier * inflow, 0), MAX_LIMIT);
  return {
    baseMultiplier,
    multiplier,
    limit: Math.round(limit),
    spread_bps: spreadBps(company.p_stress),
    status: offerStatus(company.score, company.p_stress),
  };
}

/**
 * Averages the monthly bank inflow over the most recent months.
 *
 * @param series - Monthly records, ascending.
 * @param months - Window length; defaults to the last 12 months.
 * @returns The average inflow in euros, or 0 when no month reports inflow.
 */
export function averageMonthlyInflow(
  series: readonly MonthRecord[],
  months = 12,
): number {
  const values = series
    .slice(-months)
    .map((record) => record.raw.inflow)
    .filter(
      (value): value is number => value !== null && Number.isFinite(value),
    );
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/** One point of the "how the line moves with the score" mini-timeline. */
export interface OfferPoint {
  month: string;
  score: number;
  limit: number;
  status: OfferStatus;
}

/**
 * Recomputes the line month by month so the client can see it breathe with the
 * score. Each month uses the inflow known up to that month.
 *
 * @param series - Monthly records, ascending.
 * @param months - Number of trailing months to return; defaults to 12.
 * @returns One offer point per month, ascending.
 */
export function offerTimeline(
  series: readonly MonthRecord[],
  months = 12,
): OfferPoint[] {
  const start = Math.max(series.length - months, 0);
  return series.slice(start).map((record, index) => {
    const history = series.slice(0, start + index + 1);
    const offer = computeOffer({
      score: record.score,
      p_stress: record.p_stress,
      regime: record.regime,
      avgMonthlyInflow: averageMonthlyInflow(history),
    });
    return {
      month: record.month,
      score: record.score,
      limit: offer.limit,
      status: offer.status,
    };
  });
}
