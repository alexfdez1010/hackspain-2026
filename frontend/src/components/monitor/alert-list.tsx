import { Chip } from '@heroui/react';
import Link from 'next/link';

import { formatMonth, formatSigned } from '@/lib/xray/format';
import type { Alert, AlertSeverity } from '@/lib/xray/types';

const SEVERITY_COLOR: Record<AlertSeverity, 'default' | 'warning' | 'danger'> =
  {
    info: 'default',
    warning: 'warning',
    critical: 'danger',
  };

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: 'Informativa',
  warning: 'Atención',
  critical: 'Crítica',
};

interface AlertListProps {
  alerts: readonly Alert[];
  /** Text shown when the feed is empty. */
  emptyText: string;
  /** Hides the company link when the list already lives inside a company. */
  hideCompany?: boolean;
}

/**
 * Renders an alert feed, newest month first.
 *
 * @param props - The alerts, the empty text and whether to link the company.
 * @returns The feed, or the empty text when there is nothing to show.
 */
export function AlertList({ alerts, emptyText, hideCompany }: AlertListProps) {
  if (alerts.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  return (
    <ul className="flex flex-col gap-4">
      {alerts.map((alert, index) => (
        <li
          key={`${alert.company_id}-${alert.month}-${alert.type}-${index}`}
          className="flex flex-col gap-1"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Chip
              color={SEVERITY_COLOR[alert.severity]}
              variant="soft"
              size="sm"
            >
              <Chip.Label>{SEVERITY_LABEL[alert.severity]}</Chip.Label>
            </Chip>
            <span className="font-medium">{alert.title_es}</span>
            <span className="text-sm text-muted">
              {formatMonth(alert.month)}
            </span>
            {!hideCompany && (
              <Link
                href={`/empresa/${alert.company_id}`}
                className="text-sm underline-offset-4 hover:underline"
              >
                {alert.company_id}
              </Link>
            )}
            {alert.delta !== null && (
              <span className="text-sm tabular-nums text-muted">
                {formatSigned(alert.delta)} pts
              </span>
            )}
          </div>
          {alert.detail_es && (
            <p className="max-w-3xl text-sm text-muted">{alert.detail_es}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
