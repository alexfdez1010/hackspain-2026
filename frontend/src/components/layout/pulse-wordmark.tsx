import {
  PULSE_MARK_LETTERS,
  PULSE_MARK_VIEWBOX,
  pulseMarkFill,
  type PulseMarkTone,
} from '@/components/layout/pulse-mark';

/**
 * Geometric `PULSE` wordmark used as the product mark.
 *
 * The default fill follows `currentColor`. Pass `tone="white"` for the
 * reverse lockup on a dark field.
 *
 * @param props - Optional tone for the reverse (white) variant.
 * @returns A presentational mark sized for the site header.
 */
export function PulseWordmark({ tone = 'current' }: { tone?: PulseMarkTone }) {
  const fill = pulseMarkFill(tone);
  return (
    <svg
      aria-hidden="true"
      viewBox={PULSE_MARK_VIEWBOX}
      className="inline-block h-6 w-[91px]"
    >
      {PULSE_MARK_LETTERS.map((letter) => (
        <path
          key={letter.id}
          id={letter.id}
          d={letter.d}
          fill={fill}
          fillRule={letter.evenodd ? 'evenodd' : undefined}
        />
      ))}
    </svg>
  );
}
