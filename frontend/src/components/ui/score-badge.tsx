import { formatNumber } from '@/lib/format';
import { scoreBand } from '@/lib/score';

interface ScoreBadgeProps {
  score: number | null;
  /** `lg` is used once per page, on the headline score. */
  size?: 'sm' | 'lg';
  /**
   * `score` shows the figure with the band dot in front of it. `pill` names
   * the band inside a hairline pill, for headers where the figure is already
   * displayed at hero size next to it.
   */
  variant?: 'score' | 'pill';
}

/**
 * An 8 px dot in the colour of a score band.
 *
 * @param props - Colour expression of the band.
 * @returns A decorative round swatch.
 */
function BandDot({ color }: { color: string }) {
  return (
    <i
      aria-hidden
      className="size-2 shrink-0 rounded-full"
      style={{ background: color }}
    />
  );
}

/**
 * Shows a score with the colour of its band.
 *
 * The figure itself stays in ink, as the brand asks of every metric: the band
 * is carried by the dot and by text, never by the colour of the number alone.
 * The band name is always present for assistive technology.
 *
 * @param props - Score, size and rendering variant.
 * @returns The formatted score, or the band pill.
 */
export function ScoreBadge({
  score,
  size = 'sm',
  variant = 'score',
}: ScoreBadgeProps) {
  const band = scoreBand(score);
  if (variant === 'pill') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3.5 py-1.5">
        <BandDot color={band.color} />
        <span className="text-sm font-medium leading-[1.2]">{band.name}</span>
      </span>
    );
  }
  if (size === 'lg') {
    return (
      <span
        className="text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] tabular-nums"
        title={band.label}
      >
        {formatNumber(score, 1)}
        <span className="sr-only"> — {band.label}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center justify-end gap-2 font-medium tabular-nums"
      title={band.label}
    >
      <BandDot color={band.color} />
      {formatNumber(score, 1)}
      <span className="sr-only"> — {band.label}</span>
    </span>
  );
}
