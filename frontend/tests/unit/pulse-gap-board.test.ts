import { describe, expect, it } from 'vitest';

import { buildPulseGapBoard, gapBlindNote } from '@/lib/pulse/gap';
import type { PulseMosaic, PulseMosaicCell } from '@/lib/pulse/mosaic';
import { buildPulseMosaic } from '@/lib/pulse/mosaic';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import { scoreBand } from '@/lib/score';

const source = new StaticPulseSource();
const { meta } = await source.getSummary();
const company = await source.getCompany('COMP_0001');

/**
 * Builds one cell of a month.
 *
 * @param key - Variable key.
 * @param label - Variable label.
 * @param weight - Points of the 100 owned by the variable.
 * @param score - Score of the month; `null` means no evidence.
 * @returns The cell as the mosaic lays it out.
 */
function makeCell(
  key: string,
  label: string,
  weight: number,
  score: number | null,
): PulseMosaicCell {
  return {
    key,
    label,
    pillar: 'liquidez',
    pillarLabel: 'Liquidez',
    weight,
    score,
    known: score !== null,
    band: scoreBand(score),
    rawValue: score === null ? null : 12,
    unit: 'días',
    contribution: null,
  };
}

const CELLS = [
  makeCell('a', 'Mínimo intramensual', 30, 50),
  makeCell('b', 'Días de caja', 20, 80),
  makeCell('c', 'Cartera vencida', 10, 0),
  makeCell('d', 'Utilización de líneas', 40, null),
];

const MOSAIC: PulseMosaic = {
  columns: [],
  cells: CELLS,
  unknownCount: 1,
  totalWeight: 100,
};

describe('buildPulseGapBoard', () => {
  it('ranks by points on the table, not by the lowest score', () => {
    const board = buildPulseGapBoard(MOSAIC);
    expect(board.steps.map((step) => step.key)).toEqual(['a', 'c', 'b']);
    expect(board.steps.map((step) => step.rank)).toEqual([1, 2, 3]);
    expect(board.steps[0].points).toBeCloseTo(25);
    expect(board.steps[1].points).toBeCloseTo(16.667, 3);
    expect(board.steps[2].points).toBeCloseTo(6.667, 3);
    expect(board.steps[0].band.key).toBe('neutral');
  });

  it('draws every bar against the largest gap', () => {
    const board = buildPulseGapBoard(MOSAIC);
    expect(board.steps[0].share).toBe(1);
    expect(board.steps[1].share).toBeCloseTo(0.6667, 4);
    expect(board.steps[2].share).toBeCloseTo(0.2667, 4);
  });

  it('totals the steps shown and never the whole month', () => {
    expect(buildPulseGapBoard(MOSAIC).total).toBeCloseTo(48.333, 3);
    const two = buildPulseGapBoard(MOSAIC, 2);
    expect(two.steps).toHaveLength(2);
    expect(two.total).toBeCloseTo(41.667, 3);
  });

  it('shares out the weight without data and says so', () => {
    const board = buildPulseGapBoard(MOSAIC);
    expect(board.knownWeight).toBe(60);
    expect(board.blindWeight).toBe(40);
    expect(board.blindNote).toContain('Utilización de líneas');
    expect(board.blindNote).toContain('40 puntos de peso');
    expect(board.blindNote).toContain('no tiene dato este mes');
  });

  it('keeps quiet when every variable has data', () => {
    const measured = {
      ...MOSAIC,
      cells: CELLS.slice(0, 3),
      unknownCount: 0,
      totalWeight: 60,
    };
    const board = buildPulseGapBoard(measured);
    expect(board.blindWeight).toBe(0);
    expect(board.blindNote).toBeNull();
    expect(gapBlindNote(CELLS.slice(0, 3), 0)).toBeNull();
  });

  it('names the variables without data in a list', () => {
    const note = gapBlindNote(
      [
        makeCell('a', 'Utilización de líneas', 14, null),
        makeCell('b', 'Aceleración de líneas', 4, null),
      ],
      18,
    );
    expect(note).toContain('Utilización de líneas y Aceleración de líneas');
    expect(note).toContain('no tienen dato este mes');
  });

  it('reads the last close of a real company', () => {
    const last = company?.series[company.series.length - 1] ?? null;
    const board = buildPulseGapBoard(
      buildPulseMosaic(meta.pillars, meta.variables, last),
    );
    expect(board.steps).toHaveLength(3);
    expect(board.total).toBeGreaterThan(0);
    expect(board.total).toBeLessThanOrEqual(100 - (last?.pulse ?? 0) + 1e-6);
    expect(board.blindNote).not.toBeNull();
  });

  it('survives a month with no evidence at all', () => {
    const blind = buildPulseGapBoard(
      buildPulseMosaic(meta.pillars, meta.variables, null),
    );
    expect(blind.steps).toHaveLength(0);
    expect(blind.total).toBe(0);
    expect(blind.knownWeight).toBe(0);
  });
});
