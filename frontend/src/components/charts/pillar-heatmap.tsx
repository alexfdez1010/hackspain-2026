import Link from 'next/link';

import { formatNumber } from '@/lib/xray/format';
import { scoreColor } from '@/lib/xray/score';
import type { PillarHeatRow } from '@/lib/xray/source/types';
import { PILLAR_KEYS } from '@/lib/xray/types';

interface PillarHeatmapProps {
  /** Companies to show, worst score first. */
  rows: readonly PillarHeatRow[];
  /** Spanish pillar labels coming from the dataset. */
  labels: Record<string, string>;
}

/**
 * Shows which pillars are failing in the weakest companies of the portfolio.
 *
 * Cell colour is the pillar band and the number is the pillar score, so the
 * analyst can tell a liquidity problem from a payment-behaviour problem before
 * opening any company.
 *
 * @param props - The rows to display and the pillar labels.
 * @returns A scrollable heatmap grid.
 */
export function PillarHeatmap({ rows, labels }: PillarHeatmapProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">Sin empresas que mostrar.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[34rem] border-separate border-spacing-y-1 text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th scope="col" className="font-medium">
              Empresa
            </th>
            <th scope="col" className="pr-2 text-right font-medium">
              Score
            </th>
            {PILLAR_KEYS.map((key) => (
              <th
                key={key}
                scope="col"
                className="px-1 text-center font-medium"
              >
                {(labels[key] ?? key).split(' ')[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="pr-3">
                <Link
                  href={`/empresa/${row.id}`}
                  className="tabular-nums underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
              </td>
              <td className="pr-2 text-right tabular-nums">
                {formatNumber(row.score, 1)}
              </td>
              {PILLAR_KEYS.map((key) => {
                const value = row.pillars[key];
                return (
                  <td key={key} className="px-1">
                    <span
                      className="flex h-7 items-center justify-center rounded-sm text-xs tabular-nums text-foreground"
                      style={{
                        backgroundColor:
                          value === null
                            ? 'var(--surface-secondary)'
                            : `color-mix(in oklab, ${scoreColor(value)} 34%, transparent)`,
                      }}
                      title={`${labels[key] ?? key}: ${formatNumber(value)}`}
                    >
                      {formatNumber(value)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
