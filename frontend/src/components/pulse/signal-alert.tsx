import { Chip } from '@heroui/react';
import Link from 'next/link';

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
  return (
    <aside
      role="status"
      aria-label={`Señal: ${signal.headline}`}
      className="flex flex-col gap-2 rounded-xl px-4 py-3 sm:flex-row sm:items-start sm:gap-5 sm:px-5"
      style={{
        background: `color-mix(in oklab, ${meta.color} 12%, transparent)`,
        borderLeft: `4px solid ${meta.color}`,
      }}
    >
      <div className="flex shrink-0 items-center gap-2 sm:pt-0.5">
        <Chip
          size="sm"
          variant="soft"
          color={meta.tone === 'negative' ? 'danger' : 'success'}
        >
          <Chip.Label>{meta.label}</Chip.Label>
        </Chip>
        <span className="text-xs text-muted">
          {describeSignalAge(signal, company.month)} ·{' '}
          {describeSignalStatus(signal)}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-semibold">{signal.headline}</p>
        <p className="text-sm text-muted">{signal.detail}</p>
        <Link
          href={href}
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          Ver todas las señales
        </Link>
      </div>
    </aside>
  );
}
