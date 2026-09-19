import {
  SCORE_QUADRANTS_CLASS,
  scoreQuadrantGradient,
} from '@/lib/landing/score-quadrants';

/**
 * Four score levels painted as hard quadrants under a landing dither.
 *
 * Decorative only. The dither canvas above it blends into this field so
 * each of the four sparkles takes the colour of one level; the field itself
 * never shows, because the canvas paints an opaque back over it.
 *
 * @returns A full-size, aria-hidden colour field.
 */
export function ScoreQuadrants() {
  return (
    <div
      aria-hidden
      className={`${SCORE_QUADRANTS_CLASS} pointer-events-none absolute inset-0`}
      style={{ background: scoreQuadrantGradient() }}
    />
  );
}
