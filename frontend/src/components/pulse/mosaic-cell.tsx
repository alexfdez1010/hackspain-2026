'use client';

import { bandTint } from '@/lib/pulse/band';
import type { PulseMosaicCell } from '@/lib/pulse/mosaic';
import { formatNumber } from '@/lib/format';

/** Pixels of height each point of weight buys a cell. */
export const PIXELS_PER_POINT = 13;

/** Share of the band colour a cell keeps, resting and selected. */
const TINT = { rest: 12, selected: 22 } as const;

interface MosaicCellProps {
  cell: PulseMosaicCell;
  selected: boolean;
  onSelect: (key: string) => void;
}

/**
 * One variable of the mosaic: a cell as tall as the variable weighs.
 *
 * Height carries the weight and the band tints the whole cell, so the severity
 * of a month reads at a glance across the mosaic without a dot repeating what
 * the surface already says. The cell keeps a plain hairline and only the
 * selected one takes the brand blue, so picking a variable is the single piece
 * of state the border has to carry. A variable with no evidence keeps a grey
 * surface and says «—» instead of a zero, because an unmeasured variable is
 * not a bad one: it is one the month had to leave out.
 *
 * @param props - The cell, whether it is the selected one and the handler.
 * @returns The cell button.
 */
export function MosaicCell({ cell, selected, onSelect }: MosaicCellProps) {
  const ink = cell.known ? 'text-ink' : 'text-ink-secondary';
  const background = cell.known
    ? bandTint(cell.score, selected ? TINT.selected : TINT.rest)
    : undefined;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(cell.key)}
      style={{ minHeight: `${cell.weight * PIXELS_PER_POINT}px`, background }}
      className={`flex flex-col justify-between gap-2 rounded-lg border px-3.5 py-3 text-left ${
        selected
          ? 'border-[var(--brand-blue,var(--accent))]'
          : 'border-hairline'
      } ${cell.known ? '' : 'bg-surface-secondary'}`.trim()}
    >
      <span className={`text-sm leading-tight font-medium ${ink}`}>
        {cell.label}
      </span>
      <span className="flex w-full items-baseline justify-between gap-2.5">
        <span
          className={`text-xl leading-none font-semibold tracking-[-0.01em] tabular-nums ${ink}`}
        >
          {cell.known ? formatNumber(cell.score, 1) : '—'}
        </span>
        <span className="text-ink-secondary text-[13px] whitespace-nowrap">
          {formatNumber(cell.weight)} pts
        </span>
      </span>
    </button>
  );
}
