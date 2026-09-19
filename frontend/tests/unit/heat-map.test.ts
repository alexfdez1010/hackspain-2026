import { describe, expect, it } from 'vitest';

import { buildVariableHeatMap, HEAT_MAP_SIZE } from '@/lib/pulse/heat-map';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import { makeSeriesPoint } from './pulse-fixtures';

const { meta } = await new StaticPulseSource().getSummary();
const company = await new StaticPulseSource().getCompany('COMP_0001');
const last = company?.series[company.series.length - 1] ?? null;

describe('buildVariableHeatMap', () => {
  it('keeps the treemap layout and colours every cell by its score', () => {
    const map = buildVariableHeatMap(meta.pillars, meta.variables, last);
    expect(map.width).toBe(HEAT_MAP_SIZE.width);
    expect(map.cells).toHaveLength(meta.variables.length);
    expect(map.totalWeight).toBe(100);
    expect(map.unknownCount).toBe(2);
    const area = map.cells.reduce(
      (sum, cell) => sum + cell.width * cell.height,
      0,
    );
    const cashDays = map.cells.find((cell) => cell.key === 'cash_days');
    expect(cashDays?.score).toBeCloseTo(38.96);
    expect(cashDays?.band.key).toBe('fragile');
    expect((cashDays!.width * cashDays!.height) / area).toBeCloseTo(
      cashDays!.weight / 100,
      1,
    );
    const locUtil = map.cells.find((cell) => cell.key === 'loc_util');
    expect(locUtil?.known).toBe(false);
    expect(locUtil?.score).toBeNull();
    const ar90 = map.cells.find((cell) => cell.key === 'ar90');
    expect(ar90?.band.key).toBe('solid');
  });

  it('reads the pillar scores of the month', () => {
    const map = buildVariableHeatMap(meta.pillars, meta.variables, last);
    const liquidity = map.groups.find((group) => group.key === 'liquidez');
    expect(liquidity?.score).toBeCloseTo(34.33);
    expect(liquidity?.band.key).toBe('critical');
  });

  it('renders every cell as unknown without a month', () => {
    const map = buildVariableHeatMap(meta.pillars, meta.variables, null);
    expect(map.unknownCount).toBe(meta.variables.length);
    expect(map.groups.every((group) => group.score === null)).toBe(true);
  });

  it('treats a known variable without score as unknown', () => {
    const point = makeSeriesPoint({
      variables: { cash_days: { score: null, raw: 1, known: true } },
    });
    const map = buildVariableHeatMap(meta.pillars, meta.variables, point);
    expect(map.cells.find((cell) => cell.key === 'cash_days')?.known).toBe(
      false,
    );
  });
});
