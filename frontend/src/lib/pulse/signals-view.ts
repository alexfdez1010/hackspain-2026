import type { PulseSignal } from '@/lib/pulse/types';

/** The signals of a company split the way the signals page reads them. */
export interface SignalsView {
  /** Episodes whose outcome is not known yet, newest first. */
  open: PulseSignal[];
  /** Episodes settled three months after they opened, newest first. */
  settled: PulseSignal[];
  /** Falls that stayed. */
  confirmedFalls: number;
  /** Rises that stayed. */
  confirmedRises: number;
  /** Settled episodes whose name the month they opened matched the outcome. */
  rightCalls: number;
}

/**
 * Tells whether the name given the month a signal opened matched what
 * followed: «caída»/«mejora» for a persistent episode, «bache»/«repunte» for
 * a transitory one.
 *
 * @param signal - A settled signal.
 * @returns `true` when the call was right; `false` when open or wrong.
 */
export function wasRightCall(signal: PulseSignal): boolean {
  if (signal.outcome === null) return false;
  const calledPersistent = signal.kind === 'caida' || signal.kind === 'mejora';
  return calledPersistent === (signal.outcome === 'persistente');
}

/**
 * Splits and counts the signals of a company for the signals page.
 *
 * @param signals - Signals in any order.
 * @returns Open and settled lists, newest first, with the headline counts.
 */
export function buildSignalsView(signals: readonly PulseSignal[]): SignalsView {
  const newestFirst = [...signals].sort((a, b) =>
    b.month.localeCompare(a.month),
  );
  const open = newestFirst.filter((signal) => signal.outcome === null);
  const settled = newestFirst.filter((signal) => signal.outcome !== null);
  return {
    open,
    settled,
    confirmedFalls: settled.filter(
      (s) => s.direction === 'down' && s.outcome === 'persistente',
    ).length,
    confirmedRises: settled.filter(
      (s) => s.direction === 'up' && s.outcome === 'persistente',
    ).length,
    rightCalls: settled.filter(wasRightCall).length,
  };
}
