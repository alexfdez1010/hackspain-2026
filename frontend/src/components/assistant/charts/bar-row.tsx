import type { ReactNode } from 'react';

interface BarRowProps {
  label: string;
  /** Muted reading printed after the label, such as the raw figure. */
  detail?: string;
  /** The figure, printed at the right end of the label line. */
  value: ReactNode;
  /** What the bar says, for assistive technology. */
  ariaLabel: string;
  /** The bar itself, drawn under the label line at full width. */
  children: ReactNode;
}

/**
 * One row of a bar chart in the narrow chat panel: the label and the figure
 * on one line, the bar at full width under them.
 *
 * Stacking the bar keeps every label whole at 440 px, where a side-by-side
 * grid would truncate «Mínimo intramensual de caja» to its first word.
 *
 * @param props - Label, optional detail, figure, accessible text and the bar.
 * @returns The row, as a list item.
 */
export function BarRow({
  label,
  detail,
  value,
  ariaLabel,
  children,
}: BarRowProps) {
  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3 text-xs">
        <span className="min-w-0 truncate text-foreground">
          {label}
          {detail ? <span className="text-muted"> · {detail}</span> : null}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums">{value}</span>
      </div>
      <span role="img" aria-label={ariaLabel} className="block">
        {children}
      </span>
    </li>
  );
}
