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
  /** Indices of the months whose label is printed. */
  labels: ReadonlySet<number>;
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

/** Pixels a step label needs from a fixed label to be printed. */
const LABEL_CLEARANCE = 40;

/**
 * Chooses the months whose label is printed on the axis.
 *
 * The last close and the farthest horizon are always named; the other labels
 * follow the step, skipping any month that would sit too close to one of
 * those two, so no label overlaps another on a narrow plot.
 *
 * @param xs - Horizontal position of every point, in pixels.
 * @param boundaryIndex - Index of the last observed month.
 * @param step - Index step between printed labels.
 * @returns The indices to label.
 */
export function labelIndices(
  xs: readonly number[],
  boundaryIndex: number,
  step: number,
): Set<number> {
  const count = xs.length;
  const fixed = [boundaryIndex, count - 1].filter((index) => index >= 0);
  const labels = new Set(fixed);
  for (let index = 0; index < count; index += step) {
    const clear = fixed.every(
      (anchor) => Math.abs(xs[anchor] - xs[index]) >= LABEL_CLEARANCE,
    );
    if (clear) labels.add(index);
  }
  return labels;
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

/** Vertical domain of a trajectory, in score points. */
export interface TrajectoryDomain {
  min: number;
  max: number;
}

/** Full extent of the score scale, the domain used when none is given. */
export const FULL_DOMAIN: TrajectoryDomain = { min: 0, max: 100 };

/**
 * Narrows the vertical domain to the data, keeping the three band guides in
 * view.
 *
 * A company that lives between 38 and 48 would be a flat line on the whole
 * 0-100 scale; zooming in shows the shape of its months, and forcing 35 and 65
 * to stay inside keeps the reader's anchors on screen.
 *
 * @param points - Observed months followed by the forecast horizons.
 * @param margin - Points of headroom added above and below the data.
 * @returns The domain to draw, clamped to the 0-100 scale.
 */
export function trajectoryDomain(
  points: readonly PulseTrajectoryPoint[],
  margin = 6,
): TrajectoryDomain {
  const values = points.flatMap((point) =>
    [point.value, point.p10, point.p90].filter(
      (value): value is number => value !== null && Number.isFinite(value),
    ),
  );
  if (values.length === 0) return FULL_DOMAIN;
  return {
    min: Math.max(0, Math.min(...values, 35) - margin),
    max: Math.min(100, Math.max(...values, 65) + margin),
  };
}

/**
 * Places the trajectory in a chart box.
 *
 * @param points - Observed months followed by the forecast horizons.
 * @param boundaryIndex - Index of the last observed month.
 * @param box - Chart box, whose width is the measured pixel width.
 * @param domain - Vertical domain; the whole scale by default.
 * @returns The placed points, the two lines and the band.
 */
export function layoutTrajectory(
  points: readonly PulseTrajectoryPoint[],
  boundaryIndex: number,
  box: ChartBox,
  domain: TrajectoryDomain = FULL_DOMAIN,
): TrajectoryLayout {
  const count = points.length;
  const place = (value: number) => yAt(value, domain.min, domain.max, box);
  const placed = points.map((point, index) => ({
    ...point,
    index,
    x: xAt(index, count, box),
    y: point.value === null ? null : place(point.value),
  }));
  const banded = placed.filter(
    (point): point is PlacedTrajectoryPoint & { p10: number; p90: number } =>
      point.p10 !== null && point.p90 !== null,
  );
  const step = labelStep(count, box.width - box.padLeft - box.padRight);
  return {
    placed,
    observed: drawable(placed.slice(0, boundaryIndex + 1)),
    projected: drawable(placed.slice(boundaryIndex)),
    band: bandPath(
      banded.map((point) => ({ x: point.x, y: place(point.p90) })),
      banded.map((point) => ({ x: point.x, y: place(point.p10) })),
    ),
    labelStep: step,
    labels: labelIndices(
      placed.map((point) => point.x),
      boundaryIndex,
      step,
    ),
  };
}
