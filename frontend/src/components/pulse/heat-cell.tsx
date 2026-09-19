import { charsPerLine, wrapLabel } from '@/lib/method/text';
import type { PulseHeatCell } from '@/lib/pulse/heat-map';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/format';

/** Font size of the variable label, in viewBox units. */
const LABEL_SIZE = 13;
/** Font size of the figures and of labels in a narrow column. */
const SMALL_SIZE = 11;
/** Width under which a column switches to the small size. */
const NARROW_WIDTH = 120;
/** Inner padding of a cell. */
const PAD = 8;
/** Height of the solid band strip at the bottom of a cell. */
const STRIP = 5;
/** Deepens the tint of a linked cell while the pointer is over it. */
const HOVER_CLASS = 'transition-[fill-opacity] group-hover:[fill-opacity:0.45]';

interface HeatCellProps {
  cell: PulseHeatCell;
  /** Route of the variable page; without it the cell is not a link. */
  href?: string;
}

/**
 * Splits the label of a cell into the lines its box can hold.
 *
 * @param cell - Cell to label.
 * @returns The font size and the lines of the label.
 */
function labelLines(cell: PulseHeatCell): { size: number; lines: string[] } {
  const size = cell.width < NARROW_WIDTH ? SMALL_SIZE : LABEL_SIZE;
  const step = size + 2;
  const room = Math.max(1, Math.floor((cell.height - PAD * 2 - step) / step));
  return {
    size,
    lines: wrapLabel(
      cell.label,
      charsPerLine(cell.width - PAD * 2, size),
      room,
    ),
  };
}

/**
 * Writes the sentence a screen reader hears on the cell itself.
 *
 * @param cell - Cell being drawn.
 * @returns The score, its band and the weight of the variable.
 */
function cellTitle(cell: PulseHeatCell): string {
  const scoreText = cell.known ? formatNumber(cell.score, 0) : UNKNOWN_TEXT;
  const reading = cell.known
    ? `${scoreText} de 100, ${cell.band.label}`
    : UNKNOWN_TEXT;
  return `${cell.label}: ${reading}; ${formatNumber(cell.weight)} puntos del pilar ${cell.pillarLabel}`;
}

/**
 * Draws the rectangles and the text of one cell.
 *
 * @param props - The cell and whether it reacts to the pointer.
 * @returns The group of SVG elements of one cell.
 */
function CellBody({
  cell,
  interactive,
}: {
  cell: PulseHeatCell;
  interactive: boolean;
}) {
  const { size, lines } = labelLines(cell);
  const scoreText = cell.known ? formatNumber(cell.score, 0) : UNKNOWN_TEXT;
  const title = cellTitle(cell);
  return (
    <g role="img" aria-label={title}>
      <title>{title}</title>
      <rect
        x={cell.x}
        y={cell.y}
        width={cell.width}
        height={cell.height}
        rx={2}
        fill={cell.known ? cell.band.color : 'var(--surface-secondary)'}
        fillOpacity={cell.known ? 0.24 : 1}
        stroke={cell.known ? 'none' : 'var(--muted)'}
        strokeDasharray={cell.known ? undefined : '4 3'}
        strokeOpacity={0.5}
        className={interactive && cell.known ? HOVER_CLASS : undefined}
      />
      {cell.known && (
        <rect
          x={cell.x}
          y={cell.y + cell.height - STRIP}
          width={cell.width}
          height={STRIP}
          fill={cell.band.color}
        />
      )}
      {lines.map((line, index) => (
        <text
          key={`${cell.key}-${index}`}
          x={cell.x + PAD}
          y={cell.y + PAD + size + index * (size + 2)}
          fill="var(--foreground)"
          style={{ fontSize: size }}
        >
          {line}
        </text>
      ))}
      <text
        x={cell.x + PAD}
        y={cell.y + cell.height - PAD - STRIP}
        fill={cell.known ? 'var(--foreground)' : 'var(--muted)'}
        className="tabular-nums"
        style={{ fontSize: SMALL_SIZE, fontWeight: cell.known ? 600 : 400 }}
      >
        {scoreText}
      </text>
    </g>
  );
}

/**
 * Draws one variable: a cell tinted with the colour of its band, a solid
 * strip of that colour along the bottom, and the label with the score.
 *
 * A variable without evidence keeps a neutral surface and a dashed outline,
 * so «sin datos» never looks like a low score. The geometry comes from the
 * cell, so the same drawing serves the column and the row layouts.
 *
 * With a `href` the whole cell becomes a plain SVG anchor to the page of the
 * variable — `next/link` cannot be used inside an SVG — and deepens its tint
 * under the pointer. The info button laid over the cell stays on top and
 * keeps working.
 *
 * @param props - The cell to draw and, optionally, the page it opens.
 * @returns The cell, wrapped in a link when it has a destination.
 */
export function HeatCell({ cell, href }: HeatCellProps) {
  if (!href) return <CellBody cell={cell} interactive={false} />;
  return (
    <a
      href={href}
      className="group cursor-pointer"
      aria-label={`Abrir la página de ${cell.label}`}
    >
      <CellBody cell={cell} interactive />
    </a>
  );
}
