import { SCORE_BANDS, scoreBand, type ScoreBand } from '@/lib/score';
import type { CSSProperties } from 'react';

/** Lowest and highest score any 0-100 ruler draws. */
export const BAND_SCALE = { min: 0, max: 100 } as const;

/** Splits `Crítico (<35)` into its name and its range. */
const LABEL = /^(.*) \((.*)\)$/;

/**
 * Reads the range of a band without its name.
 *
 * @param band - Band descriptor.
 * @returns A range such as `35-50`, or an empty string.
 */
export function bandRange(band: ScoreBand): string {
  return LABEL.exec(band.label)?.[2] ?? '';
}

/**
 * Clamps the open ends of a band to the drawable 0-100 scale.
 *
 * The worst band opens at minus infinity and the best one never closes, which
 * cannot be placed on a ruler; both are cut at the ends of the scale.
 *
 * @param band - Band descriptor.
 * @returns The bounds to draw, in score units.
 */
export function bandBounds(band: ScoreBand): { min: number; max: number } {
  return {
    min: Math.max(band.min, BAND_SCALE.min),
    max: Math.min(band.max, BAND_SCALE.max),
  };
}

/** The four bands with drawable bounds, worst first. */
export const DRAWABLE_BANDS = SCORE_BANDS.map((band) => ({
  band,
  ...bandBounds(band),
}));

/** Colour of a dot that stands for «no evidence this month». */
export const NO_DATA_COLOR = 'var(--border-subtle, #d2d2db)';

/**
 * Surface of a card that carries a score: a wash of its band behind the
 * figure and a border of the same hue, both mixed with the neutral tokens so
 * they read in light and dark mode without a token per band.
 *
 * The mix is the one the signal alert uses, so every tinted surface of the
 * product says «severity» the same way. Without a score the card keeps its
 * plain surface: an unmeasured variable has no severity.
 *
 * @param score - Score in the 0-100 range, or `null` when the month has none.
 * @returns Inline styles for the card, or `undefined` to keep the plain surface.
 */
export function bandSurfaceStyle(
  score: number | null,
): CSSProperties | undefined {
  if (score === null || !Number.isFinite(score)) return undefined;
  const tone = scoreBand(score).color;
  return {
    borderColor: `color-mix(in oklab, ${tone} 30%, var(--border-subtle))`,
    background: `color-mix(in oklab, ${tone} 8%, var(--surface-raised))`,
  };
}
