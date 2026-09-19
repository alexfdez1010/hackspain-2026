import { formatSigned } from '@/lib/xray/format';

/** One diverging bar: a driver and its signed contribution in points. */
export interface ImpactItem {
  key: string;
  label: string;
  value: number;
  /** Optional second line shown under the label. */
  detail?: string;
}

interface ImpactBarsProps {
  items: readonly ImpactItem[];
  /** Fallback rendered when the model returned no driver. */
  emptyText: string;
  /** Fraction digits of the printed contribution. */
  digits?: number;
}

/**
 * Draws signed contributions around a shared zero axis, negative to the left.
 *
 * Bars are scaled against the largest absolute contribution of the set, so the
 * relative weight of each driver is readable without an axis.
 *
 * @param props - Drivers, the text shown when there are none and the precision
 * of the printed contribution.
 * @returns A diverging bar list.
 */
export function ImpactBars({ items, emptyText, digits = 1 }: ImpactBarsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 1);
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const ratio = (Math.abs(item.value) / max) * 50;
        const positive = item.value >= 0;
        return (
          <li
            key={item.key}
            className="grid grid-cols-[1fr_8rem_3.5rem] items-center gap-3 text-sm max-sm:grid-cols-[1fr_4rem_3rem]"
          >
            <span className="min-w-0">
              <span className="block truncate">{item.label}</span>
              {item.detail && (
                <span className="block truncate text-xs text-muted">
                  {item.detail}
                </span>
              )}
            </span>
            <span className="relative block h-2">
              <span className="absolute inset-y-0 left-1/2 w-px bg-separator" />
              <span
                className="absolute inset-y-0 rounded-sm"
                style={{
                  width: `${ratio}%`,
                  left: positive ? '50%' : `${50 - ratio}%`,
                  backgroundColor: positive
                    ? 'var(--score-solid)'
                    : 'var(--score-critical)',
                }}
              />
            </span>
            <span className="text-right tabular-nums">
              {formatSigned(item.value, digits)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
