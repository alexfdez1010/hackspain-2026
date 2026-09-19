import { SIGNAL_KINDS } from '@/lib/pulse/signals';
import type { PulseSignalKind } from '@/lib/pulse/types';

/**
 * Feedback colour a signal is tinted with: a move against the company reads
 * as danger and a move in its favour as success, whichever band the score
 * itself lands in.
 *
 * @param tone - Whether the move helps or hurts the company.
 * @returns The CSS expression of the feedback colour.
 */
function toneColor(tone: 'negative' | 'positive'): string {
  return tone === 'negative'
    ? 'var(--feedback-danger)'
    : 'var(--feedback-success)';
}

interface SignalKindChipProps {
  kind: PulseSignalKind;
}

/**
 * States what one month was: a pill with an 8 px dot and the name of the kind.
 *
 * The colour never travels alone — the label is always there — and the tint
 * is the feedback colour of the direction, so a reader scanning a column of
 * chips sees «esto va a peor» before reading a single word.
 *
 * @param props - The kind of the signal.
 * @returns The state pill.
 */
export function SignalKindChip({ kind }: SignalKindChipProps) {
  const meta = SIGNAL_KINDS[kind];
  const tone = toneColor(meta.tone);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium leading-[1.2]"
      style={{
        borderColor: `color-mix(in oklab, ${tone} 35%, transparent)`,
        background: `color-mix(in oklab, ${tone} 10%, transparent)`,
      }}
    >
      <i
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ background: meta.color }}
      />
      {meta.label}
    </span>
  );
}

/**
 * Names the four kinds of signal with their colour, so the chips and the
 * chart marks read the same everywhere.
 *
 * @returns One row of dot, name and meaning per kind.
 */
export function PulseSignalKindLegend() {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] leading-[1.45] text-ink-secondary">
      {Object.values(SIGNAL_KINDS).map((kind) => (
        <div key={kind.label} className="flex items-center gap-2">
          <dt className="flex items-center gap-2 font-medium text-ink">
            <i
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: kind.color }}
            />
            {kind.label}
          </dt>
          <dd>{kind.meaning}</dd>
        </div>
      ))}
    </dl>
  );
}
