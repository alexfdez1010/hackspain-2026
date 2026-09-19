import { Chip } from '@heroui/react';

import { DECLINE_STATUS_LABELS } from '@/lib/advisor/format';
import type { AdvisorDeclined } from '@/lib/advisor/types';
import { formatNumber } from '@/lib/format';

interface DeclinedListProps {
  declined: readonly AdvisorDeclined[];
}

/**
 * Lists the products that were not offered, each with the rule that stopped
 * it: a blocker, or a fit below the threshold.
 *
 * @param props - Products left out.
 * @returns The list of declined products.
 */
export function DeclinedList({ declined }: DeclinedListProps) {
  if (declined.length === 0) {
    return (
      <p className="text-sm text-muted">
        Ningún producto del catálogo queda fuera.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-4">
      {declined.map((item) => (
        <li key={item.product} className="flex flex-col gap-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium">{item.label}</span>
            <Chip size="sm" variant="soft">
              <Chip.Label>
                {DECLINE_STATUS_LABELS[item.status]}
                {item.status === 'poco_encaje' && item.fit !== null
                  ? `: encaje ${formatNumber(item.fit, 0)}/100`
                  : ''}
              </Chip.Label>
            </Chip>
          </p>
          <ul className="flex max-w-3xl flex-col gap-1 text-sm text-muted">
            {item.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
