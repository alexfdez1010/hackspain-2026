interface ShareBarProps {
  /** Value drawn on the track; `null` leaves the track empty. */
  value: number | null;
  /** Value that fills the whole track. */
  max?: number;
  /** Fill colour; defaults to the neutral surface of the design system. */
  color?: string;
  /** Position of a dashed reference, in the same units as `value`. */
  guide?: number;
  /** What the bar says, for assistive technology. */
  label: string;
}

/**
 * Draws a magnitude as a horizontal bar on a shared track.
 *
 * The track is always the same width, so two rows can be compared by length
 * alone; the figure itself is always printed next to the bar, because the bar
 * is a comparison aid and never the only carrier of the value.
 *
 * @param props - The value, the scale, the colour, an optional reference and
 * the accessible description.
 * @returns The bar, with its description hidden for sighted readers.
 */
export function ShareBar({
  value,
  max = 1,
  color = 'var(--muted)',
  guide,
  label,
}: ShareBarProps) {
  const span = max > 0 ? max : 1;
  const width =
    value === null || !Number.isFinite(value)
      ? 0
      : Math.min(Math.max(value / span, 0), 1) * 100;
  return (
    <span className="inline-flex items-center">
      <span className="relative block h-2 w-20 rounded-sm bg-surface-secondary">
        <span
          className="absolute inset-y-0 left-0 rounded-sm"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
        {guide !== undefined && guide > 0 && guide <= span && (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-px bg-separator"
            style={{ left: `${(guide / span) * 100}%` }}
          />
        )}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
