import { NO_DATA_COLOR } from '@/lib/pulse/band';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/format';
import { scoreBand } from '@/lib/score';

interface ScoreHeadlineProps {
  score: number | null;
  /** What the number is, such as `PULSE de ago 2026`. */
  caption: string;
}

/**
 * A score read at a glance: the number, the band it falls in and what month
 * it belongs to.
 *
 * The band is named next to its dot, so the colour never has to be decoded:
 * it repeats what the words already say.
 *
 * @param props - The score and its caption.
 * @returns The headline block.
 */
export function ScoreHeadline({ score, caption }: ScoreHeadlineProps) {
  const band = scoreBand(score);
  return (
    <div className="flex flex-wrap items-end gap-4">
      <b className="text-[52px] font-semibold leading-tight tabular-nums tracking-tight">
        {score === null ? UNKNOWN_TEXT : formatNumber(score, 1)}
      </b>
      <span className="pb-1.5">
        <span className="mb-1 inline-flex items-center gap-2">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{
              background: score === null ? NO_DATA_COLOR : band.color,
            }}
          />
          <b className="text-sm font-medium leading-tight">
            {score === null ? UNKNOWN_TEXT : band.name}
          </b>
        </span>
        <span className="block text-[13px] text-ink-secondary">{caption}</span>
      </span>
    </div>
  );
}
