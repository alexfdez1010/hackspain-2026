import type { PulseVariableMeta } from '@/lib/pulse/types';
import { formatNumber } from '@/lib/format';

interface MethodAurocBarsProps {
  /** AUROC of each variable on its own, keyed by variable. */
  byVariable: Record<string, number>;
  variables: readonly PulseVariableMeta[];
  /** Rendered when the export carries no evaluation. */
  emptyText: string;
}

/**
 * Compares how much each variable anticipates stress on its own.
 *
 * The guide at 0,5 is the whole point of the figure: a bar that stops there
 * carries no signal in this dataset, however many points the variable owns.
 *
 * @param props - AUROC per variable, the labels and the empty text.
 * @returns A horizontal bar per variable, best first.
 */
export function MethodAurocBars({
  byVariable,
  variables,
  emptyText,
}: MethodAurocBarsProps) {
  const labels = new Map(
    variables.map((variable) => [variable.key, variable.label]),
  );
  const rows = Object.entries(byVariable)
    .map(([key, value]) => ({ key, label: labels.get(key) ?? key, value }))
    .sort((a, b) => b.value - a.value);
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  return (
    <figure className="flex max-w-3xl flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[11rem_1fr_3rem] items-center gap-3 text-sm max-sm:grid-cols-[7.5rem_1fr_2.75rem]"
          >
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="relative block h-2.5 bg-surface-secondary">
              <span
                className="absolute inset-y-0 left-0 rounded-[2px] bg-accent"
                style={{
                  width: `${Math.min(Math.max(row.value, 0), 1) * 100}%`,
                }}
              />
              <span className="absolute inset-y-[-3px] left-1/2 w-px bg-foreground/50" />
            </span>
            <span className="text-right tabular-nums">
              {formatNumber(row.value, 3)}
            </span>
          </li>
        ))}
      </ul>
      <figcaption className="text-xs text-muted">
        AUROC de cada variable por separado sobre «sin estrés en los próximos
        seis meses». La línea vertical marca 0,5: sin señal.
      </figcaption>
    </figure>
  );
}
