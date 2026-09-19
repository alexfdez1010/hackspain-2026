import { describe, expect, it } from 'vitest';

import { buildPulseMosaic, PILLAR_ORDER } from '@/lib/pulse/mosaic';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import { makeSeriesPoint } from './pulse-fixtures';

const source = new StaticPulseSource();
const { meta } = await source.getSummary();
const company = await source.getCompany('COMP_0001');
const last = company?.series[company.series.length - 1] ?? null;

describe('buildPulseMosaic', () => {
  it('orders the columns as the model is read and keeps every variable', () => {
    const mosaic = buildPulseMosaic(meta.pillars, meta.variables, last);
    expect(mosaic.columns.map((column) => column.key)).toEqual([
      ...PILLAR_ORDER,
    ]);
    expect(mosaic.cells).toHaveLength(meta.variables.length);
    expect(mosaic.totalWeight).toBe(100);
    const placed = mosaic.columns.flatMap((column) => column.cells);
    expect(placed).toHaveLength(meta.variables.length);
  });

  it('sorts each column by weight and carries the raw figure of the month', () => {
    const mosaic = buildPulseMosaic(meta.pillars, meta.variables, last);
    for (const column of mosaic.columns) {
      const weights = column.cells.map((cell) => cell.weight);
      expect([...weights].sort((a, b) => b - a)).toEqual(weights);
      expect(column.cells.every((cell) => cell.pillar === column.key)).toBe(
        true,
      );
    }
    const cashDays = mosaic.cells.find((cell) => cell.key === 'cash_days');
    expect(cashDays?.score).toBeCloseTo(38.96);
    expect(cashDays?.rawValue).toBeCloseTo(14.03, 1);
    expect(cashDays?.band.key).toBe('fragile');
    expect(cashDays?.contribution).not.toBeNull();
  });

  it('reads the pillar score of the month', () => {
    const mosaic = buildPulseMosaic(meta.pillars, meta.variables, last);
    const liquidity = mosaic.columns.find(
      (column) => column.key === 'liquidez',
    );
    expect(liquidity?.score).toBeCloseTo(34.33);
    expect(liquidity?.band.key).toBe('critical');
  });

  it('counts the variables the month has no evidence for', () => {
    const mosaic = buildPulseMosaic(meta.pillars, meta.variables, last);
    expect(mosaic.unknownCount).toBe(2);
    expect(mosaic.cells.find((cell) => cell.key === 'loc_util')?.known).toBe(
      false,
    );
  });

  it('treats a known variable without score as unknown', () => {
    const point = makeSeriesPoint({
      variables: { cash_days: { score: null, raw: 1, known: true } },
    });
    const mosaic = buildPulseMosaic(meta.pillars, meta.variables, point);
    expect(mosaic.cells.find((cell) => cell.key === 'cash_days')?.known).toBe(
      false,
    );
  });

  it('renders every cell as unknown without a month', () => {
    const mosaic = buildPulseMosaic(meta.pillars, meta.variables, null);
    expect(mosaic.unknownCount).toBe(meta.variables.length);
    expect(mosaic.columns.every((column) => column.score === null)).toBe(true);
  });
});
