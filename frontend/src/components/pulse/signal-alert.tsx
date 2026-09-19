import Link from 'next/link';

import { SignalKindChip } from '@/components/pulse/signal-kind-legend';
import {
  activeSignal,
  describeSignalAge,
  describeSignalStatus,
  SIGNAL_KINDS,
} from '@/lib/pulse/signals';
import type { PulseCompany } from '@/lib/pulse/types';

interface PulseSignalAlertProps {
  company: Pick<PulseCompany, 'signals' | 'month'>;
  /** Route of the page that lists every signal of the company. */
  href: string;
}

/**
 * The page raising its hand: the most recent signal of the last six months,
 * named as bache or caída (repunte or mejora) with what moved and, while it is
 * open, the probability that it lasts.
 *
 * It renders nothing when the recent history is quiet, so silence itself
 * carries the information: no banner means no episode.
 *
 * @param props - The company's signals and the route of the signals page.
 * @returns The alert, or `null` when there is nothing to raise.
 */
export function PulseSignalAlert({ company, href }: PulseSignalAlertProps) {
  const signal = activeSignal(company);
  if (!signal) return null;
  const meta = SIGNAL_KINDS[signal.kind];
  const tone =
    meta.tone === 'negative'
      ? 'var(--feedback-danger)'
      : 'var(--feedback-success)';
  return (
    <aside
      role="status"
      aria-label={`Señal: ${signal.headline}`}
      className="flex flex-col gap-3 rounded-xl border p-6 sm:flex-row sm:items-start sm:gap-8"
      style={{
        borderColor: `color-mix(in oklab, ${tone} 28%, var(--border-subtle))`,
        background: `color-mix(in oklab, ${tone} 6%, var(--surface-raised))`,
      }}
    >
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <SignalKindChip kind={signal.kind} />
        <span className="text-[13px] leading-[1.45] text-ink-secondary">
          {describeSignalAge(signal, company.month)} ·{' '}
          {describeSignalStatus(signal)}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-[15px] font-medium leading-[1.55]">
          {signal.headline}
        </p>
        <p className="text-[15px] leading-[1.55] text-ink-secondary">
          {signal.detail}
        </p>
        <Link
          data-arrow
          href={href}
          className="group mt-2 inline-flex w-fit items-center gap-1.5 text-[15px] font-medium leading-[1.2] text-ink"
        >
          Ver todas las señales
          <i
            aria-hidden
            className="not-italic transition-transform group-hover:translate-x-1"
          >
            →
          </i>
        </Link>
      </div>
    </aside>
  );
}
