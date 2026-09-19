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

/** Share of the band colour a plain wash keeps, in percent. */
const SURFACE_TINT = 8;

/** Share of the band colour the border of a washed card keeps, in percent. */
const BORDER_TINT = 30;

/**
 * Washes the raised surface with the colour of the band a score falls in.
 *
 * Mixing against `--surface-raised` instead of picking a colour per band keeps
 * one definition of «severity» for every tinted surface of the product and
 * lets the same call work in both themes.
 *
 * @param score - Score in the 0-100 range, or `null` when the month has none.
 * @param percent - Share of the band colour to keep, in percent.
 * @returns A `color-mix` background, or `undefined` without a score.
 */
export function bandTint(
  score: number | null,
  percent: number,
): string | undefined {
  if (score === null || !Number.isFinite(score)) return undefined;
  return `color-mix(in oklab, ${scoreBand(score).color} ${percent}%, var(--surface-raised))`;
}

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
    borderColor: `color-mix(in oklab, ${tone} ${BORDER_TINT}%, var(--border-subtle))`,
    background: bandTint(score, SURFACE_TINT),
  };
}
