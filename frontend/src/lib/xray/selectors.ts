import { scoreBand, type ScoreBandKey } from '@/lib/xray/score';
import type { Company, Direction, Regime } from '@/lib/xray/types';

/** Slim projection of a company, sent to the client for the portfolio table. */
export interface RadarRow {
  id: string;
  group: string;
  score: number;
  /** Score change versus the previous month; `null` on the first month. */
  delta1m: number | null;
  /** Score change over six months; `null` when history is shorter. */
  delta6m: number | null;
  trend6m: number;
  direction: Direction;
  regime: Regime;
  pStress: number;
  months: number;
  band: ScoreBandKey;
}

/**
 * Projects a company into the slim row rendered by the portfolio table.
 *
 * @param company - Company from the summary file.
 * @returns A row with the precomputed deltas and score band.
 */
export function toRadarRow(company: Company): RadarRow {
  return {
    id: company.company_id,
    group: company.group_id,
    score: company.score,
    delta1m:
      company.score_prev === null ? null : company.score - company.score_prev,
    delta6m:
      company.score_6m_ago === null
        ? null
        : company.score - company.score_6m_ago,
    trend6m: company.trend_6m,
    direction: company.direction,
    regime: company.regime,
    pStress: company.p_stress,
    months: company.months_observed,
    band: scoreBand(company.score).key,
  };
}

/** One bucket of the portfolio score distribution. */
export interface HistogramBin {
  /** Inclusive lower bound of the bucket. */
  from: number;
  /** Exclusive upper bound of the bucket. */
  to: number;
  count: number;
  /** Colour of the band the bucket midpoint falls into. */
  color: string;
}

/**
 * Buckets scores into fixed-width bins covering the 0-100 range.
 *
 * @param scores - Scores to bucket.
 * @param binSize - Width of each bucket in points; defaults to 5.
 * @returns Ordered buckets, including empty ones so the shape stays readable.
 */
export function scoreHistogram(
  scores: readonly number[],
  binSize = 5,
): HistogramBin[] {
  const width = binSize > 0 ? binSize : 5;
  const binCount = Math.ceil(100 / width);
  const bins: HistogramBin[] = Array.from({ length: binCount }, (_, index) => {
    const from = index * width;
    return {
      from,
      to: from + width,
      count: 0,
      color: scoreBand(from + width / 2).color,
    };
  });
  for (const score of scores) {
    if (!Number.isFinite(score)) continue;
    const index = Math.min(
      Math.max(Math.floor(score / width), 0),
      binCount - 1,
    );
    bins[index].count += 1;
  }
  return bins;
}

/** Companies with the largest six-month improvement and deterioration. */
export interface Movers {
  improvers: RadarRow[];
  decliners: RadarRow[];
}

/**
 * Ranks the portfolio by six-month score change in both directions.
 *
 * Rows without six months of history are excluded: a missing delta is not a
 * movement and would pollute both ends of the ranking.
 *
 * @param rows - Portfolio rows.
 * @param size - Number of companies per side; defaults to 10.
 * @returns The strongest improvements and the sharpest deteriorations.
 */
export function topMovers(rows: readonly RadarRow[], size = 10): Movers {
  const measurable = rows.filter(
    (row): row is RadarRow & { delta6m: number } => row.delta6m !== null,
  );
  const ascending = [...measurable].sort((a, b) => a.delta6m - b.delta6m);
  return {
    decliners: ascending.slice(0, size),
    improvers: ascending.slice(-size).reverse(),
  };
}

/**
 * Selects the companies with the lowest score, used by the pillar heatmap.
 *
 * @param companies - Companies from the summary file.
 * @param size - Number of companies to return; defaults to 20.
 * @returns The worst companies, ascending by score.
 */
export function worstByScore(
  companies: readonly Company[],
  size = 20,
): Company[] {
  return [...companies].sort((a, b) => a.score - b.score).slice(0, size);
}

/** Headline figures of the portfolio. */
export interface PortfolioStats {
  total: number;
  medianScore: number;
  deteriorating: number;
  structuralDecline: number;
  highStress: number;
}

/**
 * Computes the headline figures shown above the portfolio table.
 *
 * @param rows - Portfolio rows.
 * @returns Counts and the median score of the portfolio.
 */
export function portfolioStats(rows: readonly RadarRow[]): PortfolioStats {
  const scores = rows.map((row) => row.score).sort((a, b) => a - b);
  const middle = Math.floor(scores.length / 2);
  const medianScore =
    scores.length === 0
      ? 0
      : scores.length % 2 === 0
        ? (scores[middle - 1] + scores[middle]) / 2
        : scores[middle];
  return {
    total: rows.length,
    medianScore,
    deteriorating: rows.filter((row) => row.direction === 'deteriorating')
      .length,
    structuralDecline: rows.filter((row) => row.regime === 'structural_decline')
      .length,
    highStress: rows.filter((row) => row.pStress >= 0.35).length,
  };
}
