import { ScoreBadge } from '@/components/ui/score-badge';
import { NO_DATA_COLOR } from '@/lib/pulse/band';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/format';

interface ScoreHeadlineProps {
  score: number | null;
  /** What the number is, such as `PULSE de ago 2026`. */
  caption: string;
}

/**
 * A score read at a glance: the number, the band it falls in and what the
 * figure belongs to.
 *
 * The number and the band pill share one baseline, so the eye reads «32,8
 * crítico» as a single sentence instead of two stacked readings; the caption
 * then sits under both, because it qualifies the pair and not just the figure.
 * The band is named next to its dot, so the colour never has to be decoded: it
 * repeats what the words already say. A month with no evidence keeps the pill
 * in neutral grey instead of borrowing the colour of a band it was never
 * measured into.
 *
 * @param props - The score and its caption.
 * @returns The headline block.
 */
export function ScoreHeadline({ score, caption }: ScoreHeadlineProps) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-4">
        <b className="text-[52px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
          {score === null ? UNKNOWN_TEXT : formatNumber(score, 1)}
        </b>
        {score === null ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-3.5 py-1.5">
            <i
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: NO_DATA_COLOR }}
            />
            <span className="text-sm font-medium leading-[1.2]">
              {UNKNOWN_TEXT}
            </span>
          </span>
        ) : (
          <ScoreBadge score={score} variant="pill" />
        )}
      </div>
      <p className="mt-2 text-[13px] leading-[1.45] text-ink-secondary">
        {caption}
      </p>
    </div>
  );
}
