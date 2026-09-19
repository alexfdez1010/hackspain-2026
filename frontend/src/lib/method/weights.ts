import type { PulsePillarMeta, PulseVariableMeta } from '@/lib/pulse/types';

/** One variable placed on the map of the 100 points. */
export interface MethodWeightSegment extends PulseVariableMeta {
  /** Spanish label of the pillar the variable feeds. */
  pillarLabel: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One pillar drawn as a column, with the variables it owns. */
export interface MethodWeightGroup {
  key: string;
  label: string;
  /** Points of the 100 owned by the pillar. */
  weight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  segments: MethodWeightSegment[];
}

/** The whole map: four columns, eleven cells. */
export interface MethodWeightMap {
  groups: MethodWeightGroup[];
  /** Every cell in reading order, heaviest pillar and variable first. */
  segments: MethodWeightSegment[];
  /** Sum of the pillar weights; 100 in the published specification. */
  totalWeight: number;
  width: number;
  height: number;
}

/** Size of the drawing and the gaps that separate its blocks. */
export interface MethodWeightMapOptions {
  width?: number;
  height?: number;
  /** Gap left between two pillar columns. */
  columnGap?: number;
  /** Gap left between two variables of the same pillar. */
  rowGap?: number;
}

/**
 * Lays the eleven variables out as a treemap of the 100 points.
 *
 * A pillar is a column whose width is proportional to its weight, and a
 * variable is a cell whose height is its share of that column, so the area of
 * every cell is proportional to the points it owns: the picture and the table
 * of weights say the same thing. Gaps are removed before scaling, so they never
 * distort the proportion.
 *
 * @param pillars - Pillar metadata from the export.
 * @param variables - Variable metadata from the export.
 * @param options - Size of the drawing and gaps between blocks.
 * @returns The placed columns and cells.
 */
export function buildWeightMap(
  pillars: readonly PulsePillarMeta[],
  variables: readonly PulseVariableMeta[],
  options: MethodWeightMapOptions = {},
): MethodWeightMap {
  const { width = 720, height = 300, columnGap = 0, rowGap = 0 } = options;
  const ordered = [...pillars].sort(
    (a, b) => b.weight - a.weight || a.label.localeCompare(b.label),
  );
  const totalWeight = ordered.reduce((sum, pillar) => sum + pillar.weight, 0);
  const usableWidth = width - columnGap * Math.max(ordered.length - 1, 0);
  const scale = totalWeight > 0 ? usableWidth / totalWeight : 0;

  const groups: MethodWeightGroup[] = [];
  let cursor = 0;
  for (const pillar of ordered) {
    const members = variables
      .filter((variable) => variable.pillar === pillar.key)
      .sort((a, b) => b.weight - a.weight || a.number - b.number);
    const columnWidth = pillar.weight * scale;
    const owned = members.reduce((sum, variable) => sum + variable.weight, 0);
    const usableHeight = height - rowGap * Math.max(members.length - 1, 0);
    const rowScale = owned > 0 ? usableHeight / owned : 0;

    let top = 0;
    const segments: MethodWeightSegment[] = members.map((variable) => {
      const segment: MethodWeightSegment = {
        ...variable,
        pillarLabel: pillar.label,
        x: cursor,
        y: top,
        width: columnWidth,
        height: variable.weight * rowScale,
      };
      top += segment.height + rowGap;
      return segment;
    });

    groups.push({
      key: pillar.key,
      label: pillar.label,
      weight: pillar.weight,
      x: cursor,
      y: 0,
      width: columnWidth,
      height,
      segments,
    });
    cursor += columnWidth + columnGap;
  }

  return {
    groups,
    segments: groups.flatMap((group) => group.segments),
    totalWeight,
    width,
    height,
  };
}
