import { Chip } from '@heroui/react';

import { DECLINE_STATUS_LABELS } from '@/lib/advisor/format';
import type { AdvisorDeclined } from '@/lib/advisor/types';
import { fitPercent } from '@/lib/advisor/view';
import { formatNumber } from '@/lib/format';

/** Fit from which a product is offered, drawn as a guide on the bar. */
const OFFER_THRESHOLD = 40;

interface DeclinedListProps {
  declined: readonly AdvisorDeclined[];
}

/**
 * Draws how far a product fell from the offer threshold.
 *
 * @param props - The fit of the product.
 * @returns The figure and a compact bar with the threshold marked.
 */
function FitGap({ fit }: { fit: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted tabular-nums">
      <span className="relative block h-1.5 w-24 rounded-full bg-surface-secondary">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${fitPercent(fit)}%` }}
        />
        <span
          aria-hidden="true"
          className="absolute -inset-y-0.5 w-px bg-foreground/60"
          style={{ left: `${OFFER_THRESHOLD}%` }}
        />
      </span>
      <span>
        encaje {formatNumber(fit, 0)}/100 · se ofrece desde {OFFER_THRESHOLD}
      </span>
    </div>
  );
}

/**
 * Lists the products that were not offered as a grid: each one with the rule
 * that stopped it (a blocker, or a fit below the threshold) and the reasons
 * in the company's own figures.
 *
 * @param props - Products left out.
 * @returns The grid of declined products.
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
    <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {declined.map((item) => {
        const blocked = item.status === 'no_elegible';
        return (
          <li key={item.product} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{item.label}</h3>
              <Chip
                size="sm"
                variant="soft"
                color={blocked ? 'danger' : 'warning'}
              >
                <Chip.Label>{DECLINE_STATUS_LABELS[item.status]}</Chip.Label>
              </Chip>
            </div>
            {!blocked && item.fit !== null && <FitGap fit={item.fit} />}
            <ul className="flex flex-col gap-1 text-sm text-muted">
              {item.reasons.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden="true" className="shrink-0">
                    –
                  </span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
