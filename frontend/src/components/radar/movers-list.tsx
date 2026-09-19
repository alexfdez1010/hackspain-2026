import Link from 'next/link';

import { ScoreBadge } from '@/components/xray/score-badge';
import { formatSigned } from '@/lib/xray/format';
import { REGIME_LABELS } from '@/lib/xray/score';
import type { RadarRow } from '@/lib/xray/selectors';

interface MoversListProps {
  title: string;
  rows: readonly RadarRow[];
  /** Colour of the delta column, matching the direction of the movement. */
  tone: 'positive' | 'negative';
}

/**
 * Lists the companies that moved the most over six months.
 *
 * Both directions are shown side by side on the radar, because a model that
 * only detects deterioration cannot price an improving client.
 *
 * @param props - Heading, rows and the tone of the delta column.
 * @returns A ranked list linking to each company.
 */
export function MoversList({ title, rows, tone }: MoversListProps) {
  const color =
    tone === 'positive' ? 'var(--score-solid)' : 'var(--score-critical)';
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">Sin historial de seis meses.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="grid grid-cols-[1fr_3.5rem_4rem] items-baseline gap-3 text-sm"
            >
              <span className="min-w-0">
                <Link
                  href={`/empresa/${row.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.id}
                </Link>
                <span className="block truncate text-xs text-muted">
                  {REGIME_LABELS[row.regime]}
                </span>
              </span>
              <span className="text-right">
                <ScoreBadge score={row.score} />
              </span>
              <span
                className="text-right font-medium tabular-nums"
                style={{ color }}
              >
                {formatSigned(row.delta6m)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
