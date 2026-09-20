import { describeSignalStatus, SIGNAL_KINDS } from '@/lib/pulse/signals';
import type { PulseSignal } from '@/lib/pulse/types';

interface TrajectoryTooltipSignalProps {
  signal: PulseSignal;
}

/**
 * The signal block of the trajectory tooltip, for a month flagged with a
 * triangle: the kind of episode in its colour, the headline and the sentence
 * with the move, its drivers and its outcome or the probability it lasts.
 *
 * The triangle alone says «something happened here»; this block says what,
 * so the reader does not have to leave the chart for the alerts page to find
 * out. The text is the one the alerts page prints, never a rewording, so the
 * two surfaces cannot disagree.
 *
 * @param props - The signal that opened on the hovered month.
 * @returns The block, ruled off from the score above it.
 */
export function TrajectoryTooltipSignal({
  signal,
}: TrajectoryTooltipSignalProps) {
  const meta = SIGNAL_KINDS[signal.kind];
  return (
    <div className="mt-1.5 flex flex-col gap-1 border-t border-background/20 pt-1.5">
      <span className="flex items-center gap-1.5 text-xs font-medium">
        <span
          aria-hidden
          className="inline-block size-2 rounded-full"
          style={{ background: meta.color }}
        />
        {meta.label}
        <span className="font-normal opacity-70">
          · {describeSignalStatus(signal)}
        </span>
      </span>
      <span className="text-xs font-medium">{signal.headline}</span>
      <span className="text-xs leading-[1.45] opacity-80">{signal.detail}</span>
    </div>
  );
}
