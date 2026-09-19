import type {
  PulseCompany,
  PulseSignal,
  PulseSignalKind,
} from '@/lib/pulse/types';

/** How a signal kind is named and coloured everywhere. */
export interface SignalKindMeta {
  /** Spanish label used in chips and legends. */
  label: string;
  /** Short reading of what the kind means. */
  meaning: string;
  /** Whether the move helps or hurts the company. */
  tone: 'negative' | 'positive';
  /** CSS custom property holding the colour, for SVG and inline styles. */
  color: string;
}

/** Labels, meanings and colours of the four signal kinds. */
export const SIGNAL_KINDS: Record<PulseSignalKind, SignalKindMeta> = {
  caida: {
    label: 'Caída',
    meaning: 'bajada que va a durar',
    tone: 'negative',
    color: 'var(--score-critical)',
  },
  bache: {
    label: 'Bache',
    meaning: 'bajada que debería pasar',
    tone: 'negative',
    color: 'var(--score-fragile)',
  },
  mejora: {
    label: 'Mejora',
    meaning: 'subida que va a durar',
    tone: 'positive',
    color: 'var(--score-solid)',
  },
  repunte: {
    label: 'Repunte',
    meaning: 'subida que puede no durar',
    tone: 'positive',
    color: 'var(--score-neutral)',
  },
};

/** Months after which a signal stops being shown as the alert of the page. */
export const ALERT_WINDOW_MONTHS = 6;

/**
 * Whole months between two `YYYY-MM` strings.
 *
 * @param from - Earlier month.
 * @param to - Later month.
 * @returns `to` minus `from`, in months; negative when `from` is later.
 */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/**
 * Picks the signal the page raises its hand about: the most recent one that
 * opened within the alert window of the last observed month.
 *
 * @param company - Company with its signals and last month.
 * @returns The signal to alert, or `null` when the recent history is quiet.
 */
export function activeSignal(
  company: Pick<PulseCompany, 'signals' | 'month'>,
): PulseSignal | null {
  const latest = company.signals[company.signals.length - 1];
  if (!latest || !company.month) return null;
  const age = monthsBetween(latest.month, company.month);
  return age >= 0 && age < ALERT_WINDOW_MONTHS ? latest : null;
}

/**
 * Says how long ago a signal opened, relative to the last close.
 *
 * @param signal - Signal to describe.
 * @param lastMonth - Last observed month.
 * @returns «este mes», «hace 1 mes» or «hace N meses».
 */
export function describeSignalAge(
  signal: Pick<PulseSignal, 'month'>,
  lastMonth: string,
): string {
  const age = monthsBetween(signal.month, lastMonth);
  if (age <= 0) return 'este mes';
  return age === 1 ? 'hace 1 mes' : `hace ${age} meses`;
}

/**
 * Says what the signal is right now: still open with its probability, or
 * settled with its outcome.
 *
 * @param signal - Signal to describe.
 * @returns A short status such as «abierta, 71 % de que dure».
 */
export function describeSignalStatus(signal: PulseSignal): string {
  if (signal.outcome === 'persistente') return 'confirmada tres meses después';
  if (signal.outcome === 'transitorio')
    return 'se deshizo en menos de tres meses';
  if (signal.pPersistent === null) return 'abierta';
  return `abierta, ${Math.round(signal.pPersistent * 100)} % de que dure`;
}

/**
 * Maps every signal to the index of its month in a month list, for chart
 * markers. Signals whose month is not on the axis are skipped.
 *
 * @param months - Months on the axis, in order.
 * @param signals - Signals to place.
 * @returns Index on the axis to the signal that opened that month.
 */
export function signalsByIndex(
  months: readonly string[],
  signals: readonly PulseSignal[],
): Map<number, PulseSignal> {
  const positions = new Map(months.map((month, index) => [month, index]));
  const placed = new Map<number, PulseSignal>();
  for (const signal of signals) {
    const index = positions.get(signal.month);
    if (index !== undefined) placed.set(index, signal);
  }
  return placed;
}
