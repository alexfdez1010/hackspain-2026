/** Identifier of a score band. */
export type ScoreBandKey = 'critical' | 'fragile' | 'neutral' | 'solid';

/** Visual and textual description of a score band. */
export interface ScoreBand {
  key: ScoreBandKey;
  /** Spanish label used in filters and legends, with the range of the band. */
  label: string;
  /** Spanish name of the band on its own, for pills and captions. */
  name: string;
  /** Inclusive lower bound of the band. */
  min: number;
  /** Exclusive upper bound of the band. */
  max: number;
  /** CSS custom property holding the band colour, for SVG fills and strokes. */
  color: string;
  /** Tailwind text colour utility. */
  textClass: string;
  /** Tailwind background utility for chips and swatches. */
  bgClass: string;
}

/** The four score bands, ordered from worst to best. */
export const SCORE_BANDS: readonly ScoreBand[] = [
  {
    key: 'critical',
    name: 'Crítico',
    label: 'Crítico (<35)',
    min: Number.NEGATIVE_INFINITY,
    max: 35,
    color: 'var(--score-critical)',
    textClass: 'text-[var(--score-critical)]',
    bgClass: 'bg-[var(--score-critical)]',
  },
  {
    key: 'fragile',
    name: 'Frágil',
    label: 'Frágil (35-50)',
    min: 35,
    max: 50,
    color: 'var(--score-fragile)',
    textClass: 'text-[var(--score-fragile)]',
    bgClass: 'bg-[var(--score-fragile)]',
  },
  {
    key: 'neutral',
    name: 'Neutro',
    label: 'Neutro (50-65)',
    min: 50,
    max: 65,
    color: 'var(--score-neutral)',
    textClass: 'text-[var(--score-neutral)]',
    bgClass: 'bg-[var(--score-neutral)]',
  },
  {
    key: 'solid',
    name: 'Sólido',
    label: 'Sólido (>65)',
    min: 65,
    max: Number.POSITIVE_INFINITY,
    color: 'var(--score-solid)',
    textClass: 'text-[var(--score-solid)]',
    bgClass: 'bg-[var(--score-solid)]',
  },
];

/** Guides drawn on every 0-100 chart: the boundaries between bands. */
export const SCORE_GUIDES: readonly number[] = [35, 50, 65];

/**
 * Maps a score to its band. Bands are half-open: `[min, max)`.
 *
 * @param score - Score in the 0-100 range; `null` falls back to the neutral band.
 * @returns The matching band descriptor.
 */
export function scoreBand(score: number | null): ScoreBand {
  if (score === null || !Number.isFinite(score)) return SCORE_BANDS[2];
  return (
    SCORE_BANDS.find((band) => score >= band.min && score < band.max) ??
    SCORE_BANDS[3]
  );
}

/**
 * Resolves the colour of a score for SVG attributes.
 *
 * @param score - Score in the 0-100 range.
 * @returns A CSS colour expression.
 */
export function scoreColor(score: number | null): string {
  return scoreBand(score).color;
}
