import { SCORE_BANDS } from '@/lib/score';

/**
 * Class of the decorative quadrant field under a landing dither.
 *
 * The sparkle webp is four drawings in a 2×2. The field paints one score
 * level under each quadrant, in reading order: the level strip of the chart
 * reads worst to best, and so do the drawings (top-left critical, top-right
 * fragile, bottom-left neutral, bottom-right solid).
 */
export const SCORE_QUADRANTS_CLASS = 'score-quadrants';

/**
 * Conic gradient that paints the four score levels as hard quadrants.
 *
 * `conic-gradient` starts at twelve o'clock and turns clockwise, so the
 * quarters run top-right, bottom-right, bottom-left, top-left. The stops
 * reorder the bands (worst first) into that turn so the page reads them
 * left to right, top to bottom. The colours are the `--score-*` tokens, so
 * each band of the landing resolves its own scheme.
 *
 * @returns A CSS `conic-gradient(...)` value.
 */
export function scoreQuadrantGradient(): string {
  const [critical, fragile, neutral, solid] = SCORE_BANDS.map(
    (band) => band.color,
  );
  const turn = [fragile, solid, neutral, critical];
  const stops = turn
    .map((color, index) => `${color} ${index * 25}% ${(index + 1) * 25}%`)
    .join(', ');
  return `conic-gradient(from 0deg at 50% 50%, ${stops})`;
}
