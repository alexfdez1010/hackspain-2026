import { Chip } from '@heroui/react';

import { formatReasonValue, REASON_KIND_LABELS } from '@/lib/advisor/format';
import type { AdvisorReason, AdvisorReasonKind } from '@/lib/advisor/types';
import { sortReasons } from '@/lib/advisor/view';
import { formatSigned } from '@/lib/format';

/** Severity colour of each kind of argument. */
const KIND_COLOR: Record<AdvisorReasonKind, 'success' | 'warning' | 'danger'> =
  {
    pro: 'success',
    contra: 'warning',
    bloqueo: 'danger',
  };

interface OfferReasonsProps {
  reasons: readonly AdvisorReason[];
  /** Spanish label of every PULSE variable, keyed by variable. */
  variableLabels: Readonly<Record<string, string>>;
}

/**
 * Lists the rules that decided the fit, each with the points it moved and the
 * figure it read.
 *
 * @param props - Reasons of the offer and the variable labels of the score.
 * @returns The argument list of an offer.
 */
export function OfferReasons({ reasons, variableLabels }: OfferReasonsProps) {
  return (
    <ul className="flex flex-col gap-3">
      {sortReasons(reasons).map((reason) => {
        const figure = formatReasonValue(reason.value, reason.unit);
        const variable = reason.variable
          ? (variableLabels[reason.variable] ?? reason.variable)
          : null;
        return (
          <li key={reason.code} className="flex flex-col gap-1">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Chip size="sm" variant="soft" color={KIND_COLOR[reason.kind]}>
                <Chip.Label>{REASON_KIND_LABELS[reason.kind]}</Chip.Label>
              </Chip>
              <span className="text-xs text-muted tabular-nums">
                {formatSigned(reason.points, 0)} puntos de encaje
              </span>
            </p>
            <p className="max-w-3xl text-sm">{reason.text}</p>
            {(variable || figure) && (
              <p className="text-xs text-muted tabular-nums">
                {[variable, figure].filter(Boolean).join(': ')}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
