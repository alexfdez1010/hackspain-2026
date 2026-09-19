/** Inner drawing area of a chart, in viewBox units. */
export interface ChartBox {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
}

/**
 * Maps an index to an x coordinate spread across the plot area.
 *
 * @param index - Zero-based position of the point.
 * @param count - Total number of points.
 * @param box - Chart box.
 * @returns The x coordinate in viewBox units.
 */
export function xAt(index: number, count: number, box: ChartBox): number {
  const inner = box.width - box.padLeft - box.padRight;
  if (count <= 1) return box.padLeft + inner / 2;
  return box.padLeft + (inner * index) / (count - 1);
}

/**
 * Maps a value to a y coordinate, with the domain minimum at the bottom.
 *
 * @param value - Value to place.
 * @param min - Domain minimum.
 * @param max - Domain maximum.
 * @param box - Chart box.
 * @returns The y coordinate in viewBox units.
 */
export function yAt(
  value: number,
  min: number,
  max: number,
  box: ChartBox,
): number {
  const inner = box.height - box.padTop - box.padBottom;
  const span = max - min;
  if (span <= 0) return box.padTop + inner / 2;
  const ratio = (value - min) / span;
  return box.padTop + inner * (1 - Math.min(Math.max(ratio, 0), 1));
}

/**
 * Builds an SVG polyline path from a list of points.
 *
 * @param points - Points already in viewBox coordinates.
 * @returns An SVG path definition, or an empty string when there is no point.
 */
export function linePath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ');
}

/**
 * Closes a line path down to the baseline so it can be filled as an area.
 *
 * @param points - Points already in viewBox coordinates.
 * @param baseline - Y coordinate of the baseline.
 * @returns An SVG path definition, or an empty string when there is no point.
 */
export function areaPath(
  points: readonly { x: number; y: number }[],
  baseline: number,
): string {
  if (points.length === 0) return '';
  const last = points[points.length - 1];
  const first = points[0];
  return `${linePath(points)} L${last.x} ${baseline} L${first.x} ${baseline} Z`;
}

/**
 * Widens a value domain with a margin and optional hard bounds, so a flat
 * series is not drawn as a line glued to an edge.
 *
 * @param values - Values in the series.
 * @param options - Margin ratio and optional clamping bounds.
 * @returns The domain to use for the vertical axis.
 */
export function niceDomain(
  values: readonly number[],
  options: { margin?: number; min?: number; max?: number } = {},
): { min: number; max: number } {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0)
    return { min: options.min ?? 0, max: options.max ?? 1 };
  const rawMin = Math.min(...finite);
  const rawMax = Math.max(...finite);
  const margin = (options.margin ?? 0.1) * Math.max(rawMax - rawMin, 1);
  return {
    min: Math.max(rawMin - margin, options.min ?? Number.NEGATIVE_INFINITY),
    max: Math.min(rawMax + margin, options.max ?? Number.POSITIVE_INFINITY),
  };
}

/**
 * Builds a closed band between an upper and a lower edge.
 *
 * Both edges must already be in viewBox coordinates and share the same x
 * positions, which is what makes the shape a prediction interval and not an
 * arbitrary polygon.
 *
 * @param upper - Upper edge, left to right.
 * @param lower - Lower edge, left to right.
 * @returns An SVG path definition, or an empty string when the band is
 * narrower than two points.
 */
export function bandPath(
  upper: readonly { x: number; y: number }[],
  lower: readonly { x: number; y: number }[],
): string {
  if (upper.length < 2 || lower.length < 2) return '';
  const back = [...lower]
    .reverse()
    .map((point) => `L${point.x} ${point.y}`)
    .join(' ');
  return `${linePath(upper)} ${back} Z`;
}
