'use client';

import { bandSurfaceStyle, NO_DATA_COLOR } from '@/lib/pulse/band';
import type { PulseMosaicCell } from '@/lib/pulse/mosaic';
import { formatNumber } from '@/lib/format';

/** Pixels of height each point of weight buys a cell. */
export const PIXELS_PER_POINT = 13;

interface MosaicCellProps {
  cell: PulseMosaicCell;
  selected: boolean;
  onSelect: (key: string) => void;
}

/**
 * One variable of the mosaic: a cell as tall as the variable weighs.
 *
 * Height carries the weight and the band tints the whole cell, a wash behind
 * the figure and a border of the same hue, so the severity of a month reads
 * at a glance across the mosaic. A variable with no evidence keeps a grey
 * surface and says «—» instead of a zero, because an unmeasured variable is
 * not a bad one: it is one the month had to leave out.
 *
 * @param props - The cell, whether it is the selected one and the handler.
 * @returns The cell button.
 */
export function MosaicCell({ cell, selected, onSelect }: MosaicCellProps) {
  const ink = cell.known ? 'text-ink' : 'text-ink-secondary';
  const surface =
    selected || !cell.known ? undefined : bandSurfaceStyle(cell.score);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={() => onSelect(cell.key)}
      style={{ minHeight: `${cell.weight * PIXELS_PER_POINT}px`, ...surface }}
      className={`flex flex-col justify-between gap-2 rounded-lg border px-3.5 py-3 text-left ${
        selected
          ? 'border-[var(--brand-blue,var(--accent))] bg-brand-subtle'
          : `border-hairline ${cell.known ? 'bg-raised' : 'bg-surface-secondary'}`
      }`}
    >
      <span className={`text-sm font-medium leading-tight ${ink}`}>
        {cell.label}
      </span>
      <span className="flex w-full items-baseline justify-between gap-2.5">
        <span className="inline-flex items-center gap-[7px]">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{
              background: cell.known ? cell.band.color : NO_DATA_COLOR,
            }}
          />
          <span
            className={`text-xl font-semibold leading-none tabular-nums tracking-tight ${ink}`}
          >
            {cell.known ? formatNumber(cell.score, 1) : '—'}
          </span>
        </span>
        <span className="whitespace-nowrap text-[13px] text-ink-secondary">
          {formatNumber(cell.weight)} pts
        </span>
      </span>
    </button>
  );
}
