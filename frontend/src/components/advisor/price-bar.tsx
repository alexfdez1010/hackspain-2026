import type { PriceSegment } from '@/lib/advisor/view';

interface PriceBarProps {
  segments: readonly PriceSegment[];
  /** What the bar shows, read by assistive technology. */
  label: string;
}

/** Gap left between two segments, in bar units. */
const GAP = 0.4;

/**
 * Draws the price as a stacked bar: one segment per component, sized by its
 * weight in basis points.
 *
 * A component that lowers the rate is drawn hollow instead of in another
 * colour, because a discount on a cost and a discount on a yield point in
 * opposite directions for the company.
 *
 * @param props - The laid-out segments and the label of the whole bar.
 * @returns The stacked bar.
 */
export function PriceBar({ segments, label }: PriceBarProps) {
  return (
    <svg
      viewBox="0 0 100 6"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="h-3 w-full"
    >
      {segments.map((segment) => (
        <rect
          key={segment.key}
          x={segment.offset}
          y={0}
          width={Math.max(segment.share - GAP, 0.2)}
          height={6}
          fill={segment.subtractive ? 'none' : 'var(--accent)'}
          fillOpacity={segment.subtractive ? undefined : segment.opacity}
          stroke={segment.subtractive ? 'var(--accent)' : undefined}
          strokeWidth={segment.subtractive ? 1 : undefined}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

interface PriceSwatchProps {
  segment: PriceSegment;
}

/**
 * Repeats the fill of a segment next to its name, so the list reads as the
 * legend of the bar.
 *
 * @param props - The segment being named.
 * @returns A square swatch.
 */
export function PriceSwatch({ segment }: PriceSwatchProps) {
  return (
    <span
      aria-hidden="true"
      className="mt-1 block size-2.5 shrink-0"
      style={
        segment.subtractive
          ? { boxShadow: 'inset 0 0 0 1px var(--accent)' }
          : { backgroundColor: 'var(--accent)', opacity: segment.opacity }
      }
    />
  );
}
