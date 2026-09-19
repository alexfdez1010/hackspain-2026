import { formatSigned } from '@/lib/format';
import { lateDaysHint, type LatePartySubject } from '@/lib/pulse/details/view';

interface LateDaysCellProps {
  /** Days after the due date; negative when the invoice is settled early. */
  days: number | null;
  /** Whether the counterparty is a supplier or a customer. */
  subject: LatePartySubject;
}

/**
 * Prints how late a counterparty settles, signed and coloured by severity.
 *
 * Paying on time or early is solid, paying after the due date is critical.
 * The colour repeats what the sign already says, and the wording behind it
 * («pronto», «tarde») is exposed as the hint of the cell, so the reading
 * never rests on the colour alone.
 *
 * @param props - The signed days and who is settling.
 * @returns The figure with its hint.
 */
export function LateDaysCell({ days, subject }: LateDaysCellProps) {
  const hint = lateDaysHint(days, subject);
  if (days === null || !Number.isFinite(days)) {
    return <span className="text-ink-muted">—</span>;
  }
  const color = days > 0 ? 'var(--score-critical)' : 'var(--score-solid)';
  return (
    <span className="font-medium tabular-nums" style={{ color }} title={hint}>
      {formatSigned(days, 1)}
      <span className="sr-only"> días — {hint}</span>
    </span>
  );
}
