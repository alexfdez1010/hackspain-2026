import type { ReactNode } from 'react';

interface PlainFactProps {
  value: ReactNode;
  /** What the figure measures, printed under it. */
  label: string;
}

/**
 * One figure with its caption and nothing around it.
 *
 * Used where a figure sits beside a headline rather than inside a strip: the
 * grouping already comes from the row, so a box would only add a line.
 *
 * @param props - The figure and its caption.
 * @returns The figure block.
 */
export function PlainFact({ value, label }: PlainFactProps) {
  return (
    <span>
      <b className="block text-xl font-semibold leading-snug tabular-nums">
        {value}
      </b>
      <small className="mt-0.5 block text-[13px] text-ink-secondary">
        {label}
      </small>
    </span>
  );
}
