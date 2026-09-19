import {
  buildWeightMap,
  type MethodWeightGroup,
  type MethodWeightSegment,
} from '@/lib/method/weights';
import type {
  PulsePillarMeta,
  PulseSeriesPoint,
  PulseVariableMeta,
} from '@/lib/pulse/types';
import { scoreBand, type ScoreBand } from '@/lib/score';

/** Drawing size shared with the method treemap, in viewBox units. */
export const HEAT_MAP_SIZE = {
  width: 960,
  height: 320,
  columnGap: 6,
  rowGap: 4,
} as const;

/** One variable of the month placed on the map and coloured by its score. */
export interface PulseHeatCell extends MethodWeightSegment {
  /** Score of the variable this month; `null` without evidence. */
  score: number | null;
  /** `false` when the month carries no data for the variable. */
  known: boolean;
  /** Band of the score; the neutral band when unknown. */
  band: ScoreBand;
}

/** One pillar column with the score it reached this month. */
export interface PulseHeatGroup extends Omit<MethodWeightGroup, 'segments'> {
  score: number | null;
  band: ScoreBand;
  cells: PulseHeatCell[];
}

/** The map of a month: four columns, eleven coloured cells. */
export interface PulseHeatMap {
  groups: PulseHeatGroup[];
  cells: PulseHeatCell[];
  totalWeight: number;
  width: number;
  height: number;
  /** Variables without evidence this month. */
  unknownCount: number;
}

/**
 * Lays the eleven variables out as the method treemap does and colours every
 * cell by the score the variable reached in one month.
 *
 * The area of a cell is still its weight, so the reader sees at once both how
 * much a variable matters and how well it is doing: a big red cell is where
 * the score is being lost.
 *
 * @param pillars - Pillar metadata from the export.
 * @param variables - Variable metadata from the export.
 * @param point - Month to colour; `null` renders every cell as unknown.
 * @returns The placed, coloured columns and cells.
 */
export function buildVariableHeatMap(
  pillars: readonly PulsePillarMeta[],
  variables: readonly PulseVariableMeta[],
  point: PulseSeriesPoint | null,
): PulseHeatMap {
  const layout = buildWeightMap(pillars, variables, HEAT_MAP_SIZE);
  const groups: PulseHeatGroup[] = layout.groups.map((group) => {
    const { segments, ...rest } = group;
    const score = point?.pillars[group.key] ?? null;
    return {
      ...rest,
      score,
      band: scoreBand(score),
      cells: segments.map((segment) => {
        const value = point?.variables[segment.key];
        const known = value?.known === true && value.score !== null;
        const cellScore = known ? value.score : null;
        return {
          ...segment,
          score: cellScore,
          known,
          band: scoreBand(cellScore),
        };
      }),
    };
  });
  const cells = groups.flatMap((group) => group.cells);
  return {
    groups,
    cells,
    totalWeight: layout.totalWeight,
    width: layout.width,
    height: layout.height,
    unknownCount: cells.filter((cell) => !cell.known).length,
  };
}
