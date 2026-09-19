import { buildVariableRows } from '@/lib/pulse/company-view';
import type {
  PulsePillarMeta,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';
import { scoreBand, type ScoreBand } from '@/lib/score';

/**
 * Order the four pillars are read in, from the money coming in to the money
 * going out. It is the order of the published model, not an alphabetical one.
 */
export const PILLAR_ORDER: readonly string[] = [
  'cobro',
  'liquidez',
  'deuda',
  'pago',
];

/** One variable of the month as the mosaic draws it. */
export interface PulseMosaicCell {
  key: string;
  label: string;
  /** Key of the pillar the variable feeds. */
  pillar: string;
  /** Spanish label of that pillar. */
  pillarLabel: string;
  /** Points of the 100 owned by the variable; also its height in the column. */
  weight: number;
  score: number | null;
  /** `false` when the month carries no evidence for the variable. */
  known: boolean;
  band: ScoreBand;
  /** Raw figure behind the score, in `unit`. */
  rawValue: number | null;
  unit: string;
  /** Points of PULSE the variable adds this month. */
  contribution: number | null;
}

/** One pillar column of the mosaic. */
export interface PulseMosaicColumn {
  key: string;
  label: string;
  /** Points of the 100 owned by the pillar; also the width of the column. */
  weight: number;
  score: number | null;
  band: ScoreBand;
  cells: PulseMosaicCell[];
}

/** The month laid out as four columns of eleven cells. */
export interface PulseMosaic {
  columns: PulseMosaicColumn[];
  cells: PulseMosaicCell[];
  /** Variables the month carries no evidence for. */
  unknownCount: number;
  /** Points the four pillars own together, normally 100. */
  totalWeight: number;
}

/**
 * Position of a pillar in the published reading order.
 *
 * @param key - Pillar key.
 * @returns Its index, or a number past the end for an unknown pillar.
 */
export function pillarOrderIndex(key: string): number {
  const index = PILLAR_ORDER.indexOf(key);
  return index === -1 ? PILLAR_ORDER.length : index;
}

/**
 * Lays one observed month out as the mosaic of «Dónde se decide»: one column
 * per pillar, as wide as the pillar weighs, and one cell per variable, as tall
 * as the variable weighs.
 *
 * Area is weight and colour is band, so the eye lands on the cell that is both
 * heavy and red: that is where the score is being lost, and the only place
 * where acting changes the number.
 *
 * @param pillars - Pillar metadata from the export.
 * @param variables - Variable metadata from the export.
 * @param point - Month to read; `null` renders every cell as unknown.
 * @returns The columns, the flat list of cells and how many lack evidence.
 */
export function buildPulseMosaic(
  pillars: readonly PulsePillarMeta[],
  variables: readonly PulseVariableMeta[],
  point: PulseSeriesPoint | null,
): PulseMosaic {
  const labels = Object.fromEntries(
    pillars.map((pillar) => [pillar.key, pillar.label]),
  );
  const cells: PulseMosaicCell[] = buildVariableRows(
    variables,
    point,
    labels,
  ).map((row) => ({
    key: row.key,
    label: row.label,
    pillar: row.pillar,
    pillarLabel: row.pillarLabel,
    weight: row.weight,
    score: row.score,
    known: row.known && row.score !== null,
    band: scoreBand(row.score),
    rawValue: row.rawValue,
    unit: row.unit,
    contribution: row.contribution,
  }));

  const columns = [...pillars]
    .sort(
      (a, b) =>
        pillarOrderIndex(a.key) - pillarOrderIndex(b.key) ||
        b.weight - a.weight,
    )
    .map((pillar) => {
      const score = point?.pillars[pillar.key] ?? null;
      return {
        key: pillar.key,
        label: pillar.label,
        weight: pillar.weight,
        score,
        band: scoreBand(score),
        cells: cells.filter((cell) => cell.pillar === pillar.key),
      };
    });

  return {
    columns,
    cells,
    unknownCount: cells.filter((cell) => !cell.known).length,
    totalWeight: pillars.reduce((total, pillar) => total + pillar.weight, 0),
  };
}
