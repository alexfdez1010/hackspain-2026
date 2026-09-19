import {
  PULSE_MARK_LETTERS,
  PULSE_MARK_VIEWBOX,
  pulseMarkFill,
  type PulseMarkTone,
} from '@/components/layout/pulse-mark';

/**
 * Column-scale `PULSE` mark for the marketing hero.
 *
 * Same geometry as the nav mark. The default fill is `currentColor`; pass
 * `tone="white"` for the reverse lockup. The page heading carries the
 * accessible name.
 *
 * @param props - Optional tone for the reverse (white) variant.
 * @returns The wordmark filling the hero column.
 */
export function PulseHeroMark({ tone = 'current' }: { tone?: PulseMarkTone }) {
  const fill = pulseMarkFill(tone);
  return (
    <svg
      aria-hidden="true"
      viewBox={PULSE_MARK_VIEWBOX}
      className="h-auto w-full max-w-none"
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
