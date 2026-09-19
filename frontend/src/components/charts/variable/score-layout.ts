import {
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';
import type { PulseVariablePoint } from '@/lib/pulse/variable-series';

/** A point already placed in viewBox coordinates, `null` without a value. */
export interface PlacedValue {
  x: number;
  y: number | null;
}

/**
 * Reads the monthly score of a variable as a trajectory.
 *
 * The score chart of a variable reuses the layout, the hover columns and the
 * tooltip of the PULSE trajectory, which all read this shape. A variable has
 * no forecast of its own, so every month is observed and carries no band.
 *
 * @param points - One point per observed month, ascending.
 * @returns The same months as trajectory points.
 */
export function toTrajectory(
  points: readonly PulseVariablePoint[],
): PulseTrajectoryPoint[] {
  return points.map((point) => ({
    month: point.month,
    value: point.score,
    p10: null,
    p90: null,
    kind: 'observed' as const,
  }));
}

/**
 * Splits a placed series into the runs a single stroke can be drawn through.
 *
 * A month with no evidence breaks the line instead of being joined over, so a
 * gap in the history never reads as a straight trend across it.
 *
 * @param placed - Points in viewBox coordinates, ascending.
 * @returns One array of drawable points per uninterrupted run.
 */
export function segments(
  placed: readonly PlacedValue[],
): { x: number; y: number }[][] {
  const runs: { x: number; y: number }[][] = [];
  let current: { x: number; y: number }[] = [];
  for (const point of placed) {
    if (point.y === null) {
      if (current.length > 0) runs.push(current);
      current = [];
      continue;
    }
    current.push({ x: point.x, y: point.y });
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

/**
 * Places a monthly reference series on the 0-100 axis of the chart.
 *
 * @param values - One value per month, ascending; `null` breaks the line.
 * @param box - Chart box, whose width is the measured pixel width.
 * @returns One path definition per uninterrupted run of at least two months.
 */
export function referencePaths(
  values: readonly (number | null)[],
  box: ChartBox,
): string[] {
  const placed = values.map((value, index) => ({
    x: xAt(index, values.length, box),
    y: value === null ? null : yAt(value, 0, 100, box),
  }));
  return segments(placed)
    .filter((run) => run.length > 1)
    .map((run) => linePath(run));
}
