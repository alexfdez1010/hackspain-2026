import type { PulseMosaic, PulseMosaicCell } from '@/lib/pulse/mosaic';
import { scoreBand, type ScoreBand } from '@/lib/score';
import { formatNumber } from '@/lib/format';

/** What one variable of the month still has on the table. */
export interface PulseGap {
  key: string;
  label: string;
  /** Key of the pillar the variable feeds. */
  pillar: string;
  /** Spanish label of that pillar. */
  pillarLabel: string;
  score: number;
  /** Points of the 100 owned by the variable. */
  weight: number;
  /** Points of PULSE the score would gain if the variable reached 100. */
  points: number;
}

/**
 * Points of weight the month actually scored.
 *
 * PULSE is the weighted mean of the variables with evidence, so the weights
 * are renormalised over this total and not over 100: a month that measures
 * 82 points of weight gives every measured variable a larger share.
 *
 * @param cells - The variables of the month.
 * @returns The weight backed by data, in points.
 */
export function knownWeight(cells: readonly PulseMosaicCell[]): number {
  return cells.reduce(
    (total, cell) =>
      cell.known && cell.score !== null ? total + cell.weight : total,
    0,
  );
}

/**
 * Ranks the variables of a month by the points of PULSE each one still has to
 * give: `peso · (100 − score) / peso con dato`.
 *
 * It is the mirror image of the contribution: the eleven gaps add up to
 * exactly `100 − PULSE`, so the list says how many points are really on the
 * table and where they are, instead of pointing at the lowest score, which may
 * weigh nothing.
 *
 * @param cells - The variables of the month, as the mosaic lays them out.
 * @returns One entry per measured variable, the largest gap first.
 */
export function buildPulseGaps(cells: readonly PulseMosaicCell[]): PulseGap[] {
  const weight = knownWeight(cells);
  if (weight <= 0) return [];
  return cells
    .flatMap((cell) => {
      const { score } = cell;
      if (!cell.known || score === null) return [];
      return [
        {
          key: cell.key,
          label: cell.label,
          pillar: cell.pillar,
          pillarLabel: cell.pillarLabel,
          score,
          weight: cell.weight,
          points: (cell.weight * (100 - score)) / weight,
        },
      ];
    })
    .sort((a, b) => b.points - a.points);
}

/**
 * The variable worth acting on this month.
 *
 * @param cells - The variables of the month.
 * @returns The largest gap, or `null` when the month measured nothing.
 */
export function largestPulseGap(
  cells: readonly PulseMosaicCell[],
): PulseGap | null {
  return buildPulseGaps(cells)[0] ?? null;
}

/** How many steps the action page puts in front of the reader. */
export const GAP_STEPS = 3;

/** One gap as the action page ranks it. */
export interface PulseGapStep extends PulseGap {
  /** Position in the ranking, starting at one. */
  rank: number;
  /** Points of this gap over the points of the largest one, 0-1. */
  share: number;
  band: ScoreBand;
}

/** The next steps of a month and what the variables without data cost. */
export interface PulseGapBoard {
  /** The steps shown, largest gap first. */
  steps: PulseGapStep[];
  /** Points of PULSE of the steps shown, which is what the total names. */
  total: number;
  /** Points of weight backed by data this month. */
  knownWeight: number;
  /** Points of weight with no evidence, shared out among the rest. */
  blindWeight: number;
  /** What that blind weight means, or `null` when every variable has data. */
  blindNote: string | null;
}

/**
 * Writes what the variables without data do to the ranking.
 *
 * Their weight is shared out among the measured ones, so connecting the
 * missing source does not raise the score by itself: it puts its own weight,
 * and its own gap, into the calculation.
 *
 * @param cells - The variables of the month.
 * @param blindWeight - Points of weight with no evidence.
 * @returns The note, or `null` when every variable has data.
 */
export function gapBlindNote(
  cells: readonly PulseMosaicCell[],
  blindWeight: number,
): string | null {
  const blind = cells.filter((cell) => !cell.known).map((cell) => cell.label);
  if (blind.length === 0 || blindWeight <= 0) return null;
  const names =
    blind.length === 1
      ? blind[0]
      : `${blind.slice(0, -1).join(', ')} y ${blind[blind.length - 1]}`;
  const verb = blind.length === 1 ? 'tiene' : 'tienen';
  return (
    `${names} no ${verb} dato este mes, así que su peso se reparte entre las demás. ` +
    `Conectar esa fuente no sube el PULSE por sí solo: mete ${formatNumber(blindWeight)} puntos ` +
    'de peso en el cálculo y con ellos su propio recorrido.'
  );
}

/**
 * Builds the list of «Los tres siguientes pasos» for one month.
 *
 * The total is the sum of the steps shown, never of the eleven variables: a
 * headline figure that did not match the list underneath would read as an
 * error rather than as a wider reading.
 *
 * @param mosaic - The month laid out by `buildPulseMosaic`.
 * @param limit - How many steps to show; three by default.
 * @returns The steps, their total and the note about the missing data.
 */
export function buildPulseGapBoard(
  mosaic: PulseMosaic,
  limit: number = GAP_STEPS,
): PulseGapBoard {
  const gaps = buildPulseGaps(mosaic.cells);
  const largest = gaps[0]?.points ?? 0;
  const steps = gaps.slice(0, Math.max(limit, 0)).map((gap, index) => ({
    ...gap,
    rank: index + 1,
    share: largest > 0 ? gap.points / largest : 0,
    band: scoreBand(gap.score),
  }));
  const known = knownWeight(mosaic.cells);
  const blindWeight = mosaic.totalWeight - known;
  return {
    steps,
    total: steps.reduce((sum, step) => sum + step.points, 0),
    knownWeight: known,
    blindWeight,
    blindNote: gapBlindNote(mosaic.cells, blindWeight),
  };
}
