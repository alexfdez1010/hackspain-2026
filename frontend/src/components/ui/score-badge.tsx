import { formatNumber } from '@/lib/format';
import { scoreBand } from '@/lib/score';

interface ScoreBadgeProps {
  score: number | null;
  /** `lg` is used once per page, on the headline score. */
  size?: 'sm' | 'lg';
}

/**
 * Shows a score with the colour of its band.
 *
 * Colour alone never carries the meaning: the number is always present and the
 * band name is exposed to assistive technology.
 *
 * @param props - Score and size.
 * @returns The formatted score in its band colour.
 */
export function ScoreBadge({ score, size = 'sm' }: ScoreBadgeProps) {
  const band = scoreBand(score);
  return (
    <span
      className={
        size === 'lg'
          ? 'text-5xl font-semibold tabular-nums tracking-tight'
          : 'font-medium tabular-nums'
      }
      style={{ color: band.color }}
      title={band.label}
    >
      {formatNumber(score, 1)}
      <span className="sr-only"> — {band.label}</span>
    </span>
  );
}
