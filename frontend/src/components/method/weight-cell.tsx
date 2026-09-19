import type { KeyboardEvent } from 'react';

import { charsPerLine, wrapLabel } from '@/lib/method/text';
import type { MethodWeightSegment } from '@/lib/method/weights';
import { formatNumber } from '@/lib/format';

/** Font size of the variable label inside a wide cell, in viewBox units. */
const LABEL_SIZE = 13;
/** Font size used in a column too narrow for the full size. */
const NARROW_SIZE = 11;
/** Width under which a column switches to the narrow size. */
const NARROW_WIDTH = 120;
/** Inner padding of a cell. */
const PAD = 8;

/**
 * Splits the label of a cell into the lines its box can hold, at the font size
 * the width of its column allows.
 *
 * @param segment - Cell to label.
 * @returns The font size and the lines of the label.
 */
function labelLines(segment: MethodWeightSegment): {
  size: number;
  lines: string[];
} {
  const size = segment.width < NARROW_WIDTH ? NARROW_SIZE : LABEL_SIZE;
  const step = size + 2;
  const room = Math.max(
    1,
    Math.floor((segment.height - PAD * 2 - step) / step),
  );
  return {
    size,
    lines: wrapLabel(
      segment.label,
      charsPerLine(segment.width - PAD * 2, size),
      room,
    ),
  };
}

interface MethodWeightCellProps {
  segment: MethodWeightSegment;
  /** Sum of the weights, so the label can say «de 100». */
  total: number;
  /** `true` when the cell is the one the detail panel is showing. */
  active: boolean;
  /** Called on hover, focus, click and Enter/Space. */
  onSelect: (key: string) => void;
}

/**
 * Draws one variable of the weight map as a focusable cell.
 *
 * The cell answers to hover, click and Enter, so the detail panel can be
 * reached with the mouse, a finger and the keyboard alike. The geometry comes
 * from the segment, so the same drawing serves the column and the row layouts.
 *
 * @param props - The cell, the total, its selection state and the handler.
 * @returns The group of SVG elements of one cell.
 */
export function MethodWeightCell({
  segment,
  total,
  active,
  onSelect,
}: MethodWeightCellProps) {
  const { size, lines } = labelLines(segment);
  const handleKey = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect(segment.key);
  };
  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={`${segment.label}, ${formatNumber(segment.weight)} de ${formatNumber(total)} puntos, pilar ${segment.pillarLabel}`}
      className="cursor-pointer"
      onMouseEnter={() => onSelect(segment.key)}
      onFocus={() => onSelect(segment.key)}
      onClick={() => onSelect(segment.key)}
      onKeyDown={handleKey}
    >
      <rect
        x={segment.x}
        y={segment.y}
        width={segment.width}
        height={segment.height}
        rx={6}
        fill={active ? 'var(--text-primary)' : 'var(--surface-deep)'}
        stroke="var(--border-subtle)"
      />
      {lines.map((line, index) => (
        <text
          key={`${segment.key}-${index}`}
          x={segment.x + PAD}
          y={segment.y + PAD + size + index * (size + 2)}
          fill={active ? 'var(--surface-page)' : 'var(--text-primary)'}
          style={{ fontSize: size, fontWeight: 500 }}
        >
          {line}
        </text>
      ))}
      <text
        x={segment.x + PAD}
        y={segment.y + segment.height - PAD}
        fill={active ? 'var(--surface-page)' : 'var(--text-secondary)'}
        className="tabular-nums"
        style={{ fontSize: NARROW_SIZE }}
      >
        {formatNumber(segment.weight)} pts
      </text>
    </g>
  );
}
