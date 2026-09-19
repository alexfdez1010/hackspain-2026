import { describe, expect, it } from 'vitest';

import { STACK_OPTIONS, stackColumns } from '@/lib/method/stack';
import { buildWeightMap, stackWeightMap } from '@/lib/method/weights';
import { buildVariableHeatMap, stackHeatMap } from '@/lib/pulse/heat-map';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';

const { meta } = await new StaticPulseSource().getSummary();
const company = await new StaticPulseSource().getCompany('COMP_0001');
const last = company?.series[company.series.length - 1] ?? null;

interface Cell {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Group extends Cell {
  cells: Cell[];
}

const COLUMNS = {
  width: 100,
  height: 40,
  groups: [
    {
      key: 'a',
      x: 0,
      y: 0,
      width: 60,
      height: 40,
      cells: [
        { key: 'a1', x: 0, y: 0, width: 60, height: 30 },
        { key: 'a2', x: 0, y: 30, width: 60, height: 10 },
      ],
    },
    {
      key: 'b',
      x: 70,
      y: 0,
      width: 30,
      height: 40,
      cells: [{ key: 'b1', x: 70, y: 0, width: 30, height: 40 }],
    },
  ] satisfies Group[],
};

/**
 * Sums the areas of a list of boxes.
 *
 * @param boxes - Boxes to measure.
 * @returns The total area.
 */
function area(boxes: readonly Cell[]): number {
  return boxes.reduce((sum, box) => sum + box.width * box.height, 0);
}

describe('stackColumns', () => {
  const stacked = stackColumns(
    COLUMNS,
    (group: Group) => group.cells,
    (group, cells) => ({ ...group, cells }),
    { header: 10, scale: 0.5 },
  );

  it('turns every column into a row under its heading strip', () => {
    expect(stacked.width).toBe(40);
    expect(stacked.height).toBe(100 * 0.5 + 2 * 10);
    expect(stacked.groups[0]).toMatchObject({
      x: 0,
      y: 10,
      width: 40,
      height: 30,
    });
    expect(stacked.groups[1]).toMatchObject({
      x: 0,
      y: 70 * 0.5 + 20,
      width: 40,
      height: 15,
    });
  });

  it('spreads the cells of a row across the width in their old order', () => {
    expect(stacked.cells.map((cell) => cell.key)).toEqual(['a1', 'a2', 'b1']);
    expect(stacked.cells[0]).toMatchObject({
      x: 0,
      y: 10,
      width: 30,
      height: 30,
    });
    expect(stacked.cells[1]).toMatchObject({
      x: 30,
      y: 10,
      width: 10,
      height: 30,
    });
    expect(stacked.cells[2]).toMatchObject({ x: 0, y: 55, width: 40 });
  });

  it('keeps the proportion between areas', () => {
    const before = area(COLUMNS.groups.flatMap((group) => group.cells));
    const after = area(stacked.cells);
    for (const [index, cell] of stacked.cells.entries()) {
      const source = COLUMNS.groups.flatMap((group) => group.cells)[index];
      expect((cell.width * cell.height) / after).toBeCloseTo(
        (source.width * source.height) / before,
      );
    }
  });
});

describe('the stacked maps', () => {
  it('keeps the heat map cells, colours and totals', () => {
    const map = buildVariableHeatMap(meta.pillars, meta.variables, last);
    const stacked = stackHeatMap(map);
    expect(stacked.width).toBe(map.height);
    expect(stacked.height).toBe(
      map.width * STACK_OPTIONS.scale +
        map.groups.length * STACK_OPTIONS.header,
    );
    expect(stacked.cells).toHaveLength(map.cells.length);
    expect(stacked.unknownCount).toBe(map.unknownCount);
    expect(stacked.groups.map((group) => group.band.key)).toEqual(
      map.groups.map((group) => group.band.key),
    );
    expect(stacked.groups.every((group) => group.x === 0)).toBe(true);
    expect(stacked.cells.every((cell) => cell.x + cell.width <= 320.01)).toBe(
      true,
    );
  });

  it('keeps the weight map segments in reading order', () => {
    const map = buildWeightMap(meta.pillars, meta.variables, {
      width: 960,
      height: 320,
    });
    const stacked = stackWeightMap(map);
    expect(stacked.segments.map((segment) => segment.key)).toEqual(
      map.segments.map((segment) => segment.key),
    );
    expect(stacked.totalWeight).toBe(map.totalWeight);
    expect(stacked.groups[0].segments).toHaveLength(
      map.groups[0].segments.length,
    );
    expect(stacked.groups[1].y).toBeGreaterThan(
      stacked.groups[0].y + stacked.groups[0].height,
    );
  });
});
