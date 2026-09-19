import { SignalKindChip } from '@/components/pulse/signal-kind-legend';
import { describeSignalStatus } from '@/lib/pulse/signals';
import type { PulseSignal } from '@/lib/pulse/types';
import { formatMonth, formatNumber, formatSigned } from '@/lib/format';

interface PulseSignalTimelineProps {
  /** Signals of the company, any order. */
  signals: readonly PulseSignal[];
}

/**
 * Every month the score really moved, newest first, each named as what it
 * was: a bache that passed, a caída that stayed, a repunte or a mejora.
 *
 * Settled episodes show their outcome; open ones show the probability the
 * model gave them the month they opened, so the reader can judge the model
 * against the months that followed.
 *
 * @param props - The company's signals.
 * @returns The list, or one sentence when the history never moved.
 */
export function PulseSignalTimeline({ signals }: PulseSignalTimelineProps) {
  if (signals.length === 0) {
    return (
      <p className="max-w-[720px] text-[15px] leading-[1.55] text-ink-secondary">
        Ningún mes se ha alejado 6 puntos o más de la media de los tres
        anteriores con dos pilares moviéndose a la vez.
      </p>
    );
  }
  const ordered = [...signals].sort((a, b) => b.month.localeCompare(a.month));
  return (
    <ol className="flex flex-col">
      {ordered.map((signal) => (
        <li
          key={signal.month}
          className="grid gap-x-8 gap-y-2 border-b border-hairline py-5 first:pt-0 last:border-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)]"
        >
          <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
            <span className="text-sm font-medium leading-[1.2] tabular-nums">
              {formatMonth(signal.month)}
            </span>
            <SignalKindChip kind={signal.kind} />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-[15px] font-medium leading-[1.55]">
              {signal.headline}
              <span className="font-normal text-ink-secondary">
                {' '}
                · {formatNumber(signal.baseline, 0)} →{' '}
                {formatNumber(signal.level, 0)} · {describeSignalStatus(signal)}
              </span>
            </p>
            <p className="text-[15px] leading-[1.55] text-ink-secondary">
              {signal.detail}
            </p>
            {signal.drivers.length > 0 && (
              <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[13px] leading-[1.45] text-ink-muted">
                {signal.drivers.map((driver) => (
                  <li key={driver.pillar} className="tabular-nums">
                    {driver.label} {formatSigned(driver.delta, 0)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
