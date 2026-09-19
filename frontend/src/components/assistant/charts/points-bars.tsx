import { BarRow } from '@/components/assistant/charts/bar-row';
import type { VariableBar } from '@/lib/assistant/charts/types';
import { formatNumber } from '@/lib/format';
import { scoreBand } from '@/lib/score';

/**
 * Points each variable earned against the points it owns.
 *
 * The track is the weight of the variable, so the eleven tracks add up to
 * the 100 points of the score; the filled part is what the variable put into
 * the PULSE of the month and the empty part is what it lost. Rows come
 * largest loss first, which is the order a reader wants to act in.
 *
 * @param props - The rows and the PULSE of the month.
 * @returns The bar list with its total.
 */
export function PointsBars({
  rows,
  pulse,
}: {
  rows: readonly VariableBar[];
  pulse: number | null;
}) {
  const maxWeight = Math.max(...rows.map((row) => row.weight), 1);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">
        PULSE{' '}
        <span className="font-medium text-foreground tabular-nums">
          {formatNumber(pulse, 1)}
        </span>{' '}
        de 100. La barra es el peso de la variable; la parte coloreada, los
        puntos que aporta; el resto, los que pierde.
      </p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const band = scoreBand(row.score);
          const earned = row.known ? (row.contribution ?? 0) : 0;
          const lost = row.known ? row.weight - earned : null;
          return (
            <BarRow
              key={row.key}
              label={row.label}
              detail={
                lost === null ? 'sin datos' : `pierde ${formatNumber(lost, 1)}`
              }
              value={
                row.known ? (
                  <>
                    <span style={{ color: band.color }}>
                      {formatNumber(earned, 1)}
                    </span>
                    <span className="text-muted">/{row.weight}</span>
                  </>
                ) : (
                  <span className="text-muted">s/d/{row.weight}</span>
                )
              }
              ariaLabel={
                row.known
                  ? `${row.label}: ${formatNumber(earned, 1)} de ${row.weight} puntos`
                  : `${row.label}: sin datos, ${row.weight} puntos sin respaldo`
              }
            >
              <span className="relative block h-2.5">
                <span
                  className={`absolute inset-y-0 left-0 rounded-sm ${row.known ? 'bg-surface-secondary' : 'border border-dashed border-hairline-strong'}`}
                  style={{ width: `${(row.weight / maxWeight) * 100}%` }}
                />
                {row.known ? (
                  <span
                    className="absolute inset-y-0 left-0 rounded-sm"
                    style={{
                      width: `${(Math.max(earned, 0) / maxWeight) * 100}%`,
                      backgroundColor: band.color,
                    }}
                  />
                ) : null}
              </span>
            </BarRow>
          );
        })}
      </ul>
    </div>
  );
}
