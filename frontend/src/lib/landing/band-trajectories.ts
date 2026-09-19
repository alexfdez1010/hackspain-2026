import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';
import { SCORE_BANDS, scoreBand, type ScoreBandKey } from '@/lib/score';

/** Observed months of every marketing trajectory, oldest first. */
const OBSERVED_MONTHS = [
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06',
  '2026-07',
  '2026-08',
] as const;

/** Forecast horizons after the last close, in months. */
const HORIZONS = 12;

/**
 * Observed scores of each band, ending inside the band they illustrate.
 *
 * Each shape tells the story the band name tells: a critical company keeps
 * sliding, a fragile one falls and stalls, a neutral one climbs out of the
 * fragile band and a solid one consolidates.
 */
const OBSERVED: Readonly<Record<ScoreBandKey, readonly number[]>> = {
  critical: [44.2, 41.8, 38.6, 36.9, 33.4, 31.2, 29.5, 27.1],
  fragile: [55.3, 52.7, 49.8, 46.1, 43.4, 41.9, 44.2, 45.6],
  neutral: [47.9, 49.2, 51.8, 53.1, 55.6, 57.2, 58.4, 59.7],
  solid: [61.4, 63.7, 66.2, 68.1, 70.5, 72.3, 73.6, 74.8],
};

/** Score the forecast settles on, per band. */
const TARGET: Readonly<Record<ScoreBandKey, number>> = {
  critical: 25.4,
  fragile: 46.8,
  neutral: 61.5,
  solid: 76.2,
};

/**
 * Month string `h` months after an observed month.
 *
 * @param last - Month as `YYYY-MM`.
 * @param offset - Months to add.
 * @returns The shifted month as `YYYY-MM`.
 */
function shiftMonth(last: string, offset: number): string {
  const [year, month] = last.split('-').map(Number);
  const index = year * 12 + (month - 1) + offset;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/**
 * Builds the marketing trajectory of one score band: eight observed months
 * that end inside the band and twelve forecast months with a p10-p90 band
 * that widens with the horizon.
 *
 * Values are fixed, not random, so the landing chart is the same on every
 * visit and in every test.
 *
 * @param band - Score band to illustrate.
 * @returns Observed points followed by the forecast, and the boundary index.
 */
export function bandShowcaseTrajectory(band: ScoreBandKey): {
  points: PulseTrajectoryPoint[];
  boundaryIndex: number;
} {
  const observed = OBSERVED[band].map<PulseTrajectoryPoint>((value, i) => ({
    month: OBSERVED_MONTHS[i],
    value,
    p10: null,
    p90: null,
    kind: 'observed',
  }));
  const last = observed[observed.length - 1];
  const start = last.value ?? 0;
  const forecast = Array.from({ length: HORIZONS }, (_, i) => {
    const h = i + 1;
    const value = start + (TARGET[band] - start) * (1 - Math.exp(-h / 3));
    const spread = 3 + 0.9 * h;
    return {
      month: shiftMonth(last.month, h),
      value: Math.round(value * 10) / 10,
      p10: Math.max(0, Math.round((value - spread) * 10) / 10),
      p90: Math.min(100, Math.round((value + spread) * 10) / 10),
      kind: 'forecast' as const,
    };
  });
  return {
    points: [...observed, ...forecast],
    boundaryIndex: observed.length - 1,
  };
}

/**
 * Checks that a band's marketing trajectory really closes inside that band.
 *
 * @param band - Band to check.
 * @returns `true` when the last observed month scores inside `band`.
 */
export function bandShowcaseClosesInBand(band: ScoreBandKey): boolean {
  const { points, boundaryIndex } = bandShowcaseTrajectory(band);
  return scoreBand(points[boundaryIndex].value).key === band;
}

/** Bands in the order the landing lists them, worst first. */
export const SHOWCASE_BANDS = SCORE_BANDS;
