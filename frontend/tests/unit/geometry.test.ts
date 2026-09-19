import { describe, expect, it } from 'vitest';

import {
  areaPath,
  bandPath,
  linePath,
  niceDomain,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';

const BOX: ChartBox = {
  width: 100,
  height: 50,
  padLeft: 10,
  padRight: 10,
  padTop: 5,
  padBottom: 5,
};

describe('xAt', () => {
  it('spreads points across the plot area', () => {
    expect(xAt(0, 3, BOX)).toBe(10);
    expect(xAt(1, 3, BOX)).toBe(50);
    expect(xAt(2, 3, BOX)).toBe(90);
  });

  it('centres a single point', () => {
    expect(xAt(0, 1, BOX)).toBe(50);
  });
});

describe('yAt', () => {
  it('places the minimum at the bottom', () => {
    expect(yAt(0, 0, 100, BOX)).toBe(45);
    expect(yAt(100, 0, 100, BOX)).toBe(5);
    expect(yAt(50, 0, 100, BOX)).toBe(25);
  });

  it('clamps values outside the domain', () => {
    expect(yAt(200, 0, 100, BOX)).toBe(5);
    expect(yAt(-20, 0, 100, BOX)).toBe(45);
  });

  it('centres a degenerate domain', () => {
    expect(yAt(5, 5, 5, BOX)).toBe(25);
  });
});

describe('paths', () => {
  it('builds a polyline', () => {
    expect(
      linePath([
        { x: 0, y: 1 },
        { x: 2, y: 3 },
      ]),
    ).toBe('M0 1 L2 3');
    expect(linePath([])).toBe('');
  });

  it('closes an area down to the baseline', () => {
    expect(
      areaPath(
        [
          { x: 0, y: 1 },
          { x: 2, y: 3 },
        ],
        10,
      ),
    ).toBe('M0 1 L2 3 L2 10 L0 10 Z');
    expect(areaPath([], 10)).toBe('');
  });
});

describe('niceDomain', () => {
  it('adds a margin around the values', () => {
    expect(niceDomain([40, 60], { margin: 0.1 })).toEqual({ min: 38, max: 62 });
  });

  it('respects hard bounds', () => {
    expect(niceDomain([0, 100], { margin: 0.5, min: 0, max: 100 })).toEqual({
      min: 0,
      max: 100,
    });
  });

  it('falls back when there is nothing finite', () => {
    expect(niceDomain([Number.NaN], { min: 0, max: 1 })).toEqual({
      min: 0,
      max: 1,
    });
  });
});

describe('bandPath', () => {
  it('closes the upper edge over the reversed lower edge', () => {
    const upper = [
      { x: 0, y: 1 },
      { x: 10, y: 2 },
    ];
    const lower = [
      { x: 0, y: 8 },
      { x: 10, y: 9 },
    ];
    expect(bandPath(upper, lower)).toBe('M0 1 L10 2 L10 9 L0 8 Z');
  });

  it('draws nothing when the band has fewer than two points', () => {
    expect(bandPath([{ x: 0, y: 1 }], [{ x: 0, y: 2 }])).toBe('');
    expect(bandPath([], [])).toBe('');
  });
});
