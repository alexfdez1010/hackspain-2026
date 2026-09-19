import {
  bandPath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';

/** A trajectory point already placed in viewBox coordinates. */
export interface PlacedTrajectoryPoint extends PulseTrajectoryPoint {
  index: number;
  x: number;
  /** `null` when the month carries no score. */
  y: number | null;
}

/** Everything the chart draws, computed once per render. */
export interface TrajectoryLayout {
  placed: PlacedTrajectoryPoint[];
  /** Observed points with a score, in order. */
  observed: (PlacedTrajectoryPoint & { y: number })[];
  /** Last observed point followed by the forecast points with a score. */
  projected: (PlacedTrajectoryPoint & { y: number })[];
  /** Closed path of the p10-p90 band, or an empty string. */
  band: string;
  /** Index step between printed month labels. */
  labelStep: number;
}

/**
 * Decides how often a month label fits without overlapping its neighbour.
 *
 * @param count - Number of points on the axis.
 * @param width - Plot width in pixels.
 * @returns The index step between printed labels; `1` labels every month.
 */
export function labelStep(count: number, width: number): number {
  const room = Math.max(1, Math.floor(width / 48));
  return Math.max(1, Math.ceil(count / room));
}

/**
 * Keeps only the points with a drawable value.
 *
 * @param points - Points to filter.
 * @returns The points that carry a finite y coordinate.
 */
function drawable(points: readonly PlacedTrajectoryPoint[]) {
  return points.filter(
    (point): point is PlacedTrajectoryPoint & { y: number } => point.y !== null,
  );
}

/**
 * Places the trajectory in a chart box.
 *
 * @param points - Observed months followed by the forecast horizons.
 * @param boundaryIndex - Index of the last observed month.
 * @param box - Chart box, whose width is the measured pixel width.
 * @returns The placed points, the two lines and the band.
 */
export function layoutTrajectory(
  points: readonly PulseTrajectoryPoint[],
  boundaryIndex: number,
  box: ChartBox,
): TrajectoryLayout {
  const count = points.length;
  const placed = points.map((point, index) => ({
    ...point,
    index,
    x: xAt(index, count, box),
    y: point.value === null ? null : yAt(point.value, 0, 100, box),
  }));
  const banded = placed.filter(
    (point): point is PlacedTrajectoryPoint & { p10: number; p90: number } =>
      point.p10 !== null && point.p90 !== null,
  );
  return {
    placed,
    observed: drawable(placed.slice(0, boundaryIndex + 1)),
    projected: drawable(placed.slice(boundaryIndex)),
    band: bandPath(
      banded.map((point) => ({ x: point.x, y: yAt(point.p90, 0, 100, box) })),
      banded.map((point) => ({ x: point.x, y: yAt(point.p10, 0, 100, box) })),
    ),
    labelStep: labelStep(count, box.width - box.padLeft - box.padRight),
  };
}
