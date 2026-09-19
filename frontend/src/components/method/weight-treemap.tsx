import type { KeyboardEvent } from 'react';

import { charsPerLine, wrapLabel } from '@/lib/method/text';
import type {
  MethodWeightMap,
  MethodWeightSegment,
} from '@/lib/method/weights';
import { formatNumber } from '@/lib/format';

/** Font size of the variable label inside a wide cell, in viewBox units. */
const LABEL_SIZE = 13;
/** Font size used in a column too narrow for the full size. */
const NARROW_SIZE = 11;
/** Width under which a column switches to the narrow size. */
const NARROW_WIDTH = 120;
/** Inner padding of a cell. */
const PAD = 8;

interface CellLabelProps {
  segment: MethodWeightSegment;
  /** `true` when the cell is the one the detail panel is showing. */
  active: boolean;
}

/**
 * Writes the label of a cell inside its box.
 *
 * @param props - The cell and whether it is selected.
 * @returns One `text` element per line of the label.
 */
function CellLabel({ segment, active }: CellLabelProps) {
  const { size, lines } = labelLines(segment);
  return (
    <>
      {lines.map((line, index) => (
        <text
          key={`${segment.key}-${index}`}
          x={segment.x + PAD}
          y={segment.y + PAD + size + index * (size + 2)}
          fill={active ? 'var(--background)' : 'var(--foreground)'}
          style={{ fontSize: size }}
        >
          {line}
        </text>
      ))}
    </>
  );
}

interface MethodWeightTreemapProps {
  map: MethodWeightMap;
  /** Key of the variable the detail panel is showing. */
  selectedKey: string;
  /** Called on hover, focus, click and Enter/Space. */
  onSelect: (key: string) => void;
}

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

/**
 * Draws the 100 points of the score as a treemap: one column per pillar, one
 * cell per variable, every area proportional to the points it owns.
 *
 * Cells are focusable and answer to hover, click and Enter, so the detail panel
 * can be reached with the mouse and with the keyboard alike.
 *
 * @param props - The layout, the selected variable and the selection handler.
 * @returns The pillar header and the treemap.
 */
export function MethodWeightTreemap({
  map,
  selectedKey,
  onSelect,
}: MethodWeightTreemapProps) {
  const gap =
    map.groups.length > 1
      ? map.groups[1].x - (map.groups[0].x + map.groups[0].width)
      : 0;
  const percent = (value: number) => `${(value / map.width) * 100}%`;
  const handleKey = (event: KeyboardEvent<SVGGElement>, key: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect(key);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full text-xs">
        {map.groups.map((group, index) => (
          <div
            key={group.key}
            className="min-w-0 pr-1"
            style={{
              width: percent(group.width),
              marginLeft: index === 0 ? 0 : percent(gap),
            }}
          >
            <span className="block font-medium leading-tight">
              {group.label}
            </span>
            <span className="block tabular-nums text-muted">
              {formatNumber(group.weight)} de {formatNumber(map.totalWeight)}
            </span>
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${map.width} ${map.height}`}
        className="h-auto w-full"
        role="group"
        aria-label="Reparto de los 100 puntos entre pilares y variables"
      >
        {map.segments.map((segment) => {
          const active = segment.key === selectedKey;
          return (
            <g
              key={segment.key}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              aria-label={`${segment.label}, ${formatNumber(segment.weight)} de ${formatNumber(map.totalWeight)} puntos, pilar ${segment.pillarLabel}`}
              className="cursor-pointer"
              onMouseEnter={() => onSelect(segment.key)}
              onFocus={() => onSelect(segment.key)}
              onClick={() => onSelect(segment.key)}
              onKeyDown={(event) => handleKey(event, segment.key)}
            >
              <rect
                x={segment.x}
                y={segment.y}
                width={segment.width}
                height={segment.height}
                rx={2}
                fill={active ? 'var(--foreground)' : 'var(--surface-secondary)'}
              />
              <CellLabel segment={segment} active={active} />
              <text
                x={segment.x + PAD}
                y={segment.y + segment.height - PAD}
                fill={active ? 'var(--background)' : 'var(--muted)'}
                className="tabular-nums"
                style={{ fontSize: NARROW_SIZE }}
              >
                {formatNumber(segment.weight)} pts
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
