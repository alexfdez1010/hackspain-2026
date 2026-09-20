import type { PulseVariableRow } from '@/lib/pulse/company-view';
import { formatRawValue } from '@/lib/pulse/format';
import { knownWeight } from '@/lib/pulse/gap';
import { formatNumber } from '@/lib/format';
import { scoreBand } from '@/lib/score';

/** The worked example of how a variable becomes points of PULSE. */
export interface PulsePointsExampleLines {
  /** The real reading of the month and the score it earns in the portfolio. */
  reading: string;
  /** The arithmetic, with the three figures that produce the contribution. */
  arithmetic: string;
  /** What the same variable would put in with a perfect score. */
  ceiling: string;
}

/**
 * Writes the formula of the score with the numbers of one month instead of
 * with symbols.
 *
 * The variable chosen is the one that contributed most in the close, because
 * that is the row the reader has just seen at the top of «Aporte de cada
 * variable»: the example then explains the figure they are already looking at
 * rather than an abstract one. The weight is renormalised over the weight with
 * data, exactly as the score is, so the third line also says what the ceiling
 * of that variable is this month — the points it would put in with a score of
 * 100.
 *
 * @param rows - Variable rows of the month, as `buildVariableRows` builds them.
 * @returns The three lines, or `null` when the month measured no variable and
 * there is therefore nothing to work through.
 */
export function buildPointsExample(
  rows: readonly PulseVariableRow[],
): PulsePointsExampleLines | null {
  /* `knownWeight` reads the month as the mosaic lays it out; the band is the
     only field a variable row does not already carry, and it is derived. */
  const weight = knownWeight(
    rows.map((row) => ({ ...row, band: scoreBand(row.score) })),
  );
  if (weight <= 0) return null;
  const best = rows
    .filter(
      (row) => row.known && row.score !== null && row.contribution !== null,
    )
    .sort((a, b) => (b.contribution ?? 0) - (a.contribution ?? 0))[0];
  if (!best || best.score === null || best.contribution === null) return null;
  return {
    reading:
      `${best.label}: valor ${formatRawValue(best.rawValue, best.unit)}, ` +
      `que en la cartera puntúa ${formatNumber(best.score)} sobre 100.`,
    arithmetic:
      `${formatNumber(best.weight)} × ${formatNumber(best.score)} / ` +
      `${formatNumber(weight)} = ${formatNumber(best.contribution, 2)} puntos de PULSE`,
    ceiling:
      `Su techo son ${formatNumber((best.weight * 100) / weight, 2)} puntos, ` +
      'los que pondría con un score de 100.',
  };
}
