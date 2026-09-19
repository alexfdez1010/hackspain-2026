import { Chip } from '@heroui/react';

import { describeSignalStatus, SIGNAL_KINDS } from '@/lib/pulse/signals';
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
      <p className="text-sm text-muted">
        Ningún mes se ha alejado 6 puntos o más de la media de los tres
        anteriores con dos pilares moviéndose a la vez.
      </p>
    );
  }
  const ordered = [...signals].sort((a, b) => b.month.localeCompare(a.month));
  return (
    <ol className="flex flex-col gap-5">
      {ordered.map((signal) => {
        const meta = SIGNAL_KINDS[signal.kind];
        return (
          <li
            key={signal.month}
            className="grid gap-x-6 gap-y-1 sm:grid-cols-[7rem_1fr]"
          >
            <div className="flex items-center gap-2 sm:flex-col sm:items-start">
              <span className="text-sm font-medium tabular-nums">
                {formatMonth(signal.month)}
              </span>
              <Chip
                size="sm"
                variant="soft"
                color={meta.tone === 'negative' ? 'danger' : 'success'}
              >
                <Chip.Label>{meta.label}</Chip.Label>
              </Chip>
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium">
                {signal.headline}
                <span className="text-muted">
                  {' '}
                  · {formatNumber(signal.baseline, 0)} →{' '}
                  {formatNumber(signal.level, 0)} ·{' '}
                  {describeSignalStatus(signal)}
                </span>
              </p>
              <p className="text-sm text-muted">{signal.detail}</p>
              {signal.drivers.length > 0 && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {signal.drivers.map((driver) => (
                    <li key={driver.pillar} className="tabular-nums">
                      {driver.label} {formatSigned(driver.delta, 0)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
