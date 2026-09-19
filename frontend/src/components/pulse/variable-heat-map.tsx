import { VariableInfoLayer } from '@/components/charts/variable-info-layer';
import { charsPerLine, wrapLabel } from '@/lib/method/text';
import type { PulseHeatCell, PulseHeatMap } from '@/lib/pulse/heat-map';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import { formatNumber } from '@/lib/format';
import { SCORE_BANDS } from '@/lib/score';

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
 * Draws one variable: a cell tinted with the colour of its band, a solid
 * strip of that colour along the bottom, and the label with the score.
 *
 * A variable without evidence keeps a neutral surface and a dashed outline,
 * so «sin datos» never looks like a low score.
 *
 * @param props - The cell to draw.
 * @returns The group of SVG elements of one cell.
 */
function HeatCell({ cell }: { cell: PulseHeatCell }) {
  const { size, lines } = labelLines(cell);
  const scoreText = cell.known ? formatNumber(cell.score, 0) : UNKNOWN_TEXT;
  const title = `${cell.label}: ${cell.known ? `${scoreText} de 100, ${cell.band.label}` : UNKNOWN_TEXT}; ${formatNumber(cell.weight)} puntos del pilar ${cell.pillarLabel}`;
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

interface PulseVariableHeatMapProps {
  map: PulseHeatMap;
}

/**
 * The eleven variables of the last close as a heat map: the area of a cell is
 * the weight of the variable and its colour is the band of its score, green
 * where the company is strong and red where it is losing points.
 *
 * @param props - The coloured layout of one month.
 * Every cell carries an info button that explains the variable.
 *
 * @returns The pillar header, the map with its info buttons and the legend.
 */
export function PulseVariableHeatMap({ map }: PulseVariableHeatMapProps) {
  const gap =
    map.groups.length > 1
      ? map.groups[1].x - (map.groups[0].x + map.groups[0].width)
      : 0;
  const percent = (value: number) => `${(value / map.width) * 100}%`;
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="flex min-w-[48rem] flex-col gap-2 lg:min-w-0">
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
                <span
                  className="block font-semibold tabular-nums"
                  style={{ color: group.band.color }}
                >
                  {group.score === null
                    ? UNKNOWN_TEXT
                    : `${formatNumber(group.score, 0)} · ${group.band.label}`}
                </span>
              </div>
            ))}
          </div>
          <div className="relative">
            <svg
              viewBox={`0 0 ${map.width} ${map.height}`}
              className="h-auto w-full"
              role="group"
              aria-label="Score de cada variable en el último cierre"
            >
              {map.cells.map((cell) => (
                <HeatCell key={cell.key} cell={cell} />
              ))}
            </svg>
            <VariableInfoLayer
              cells={map.cells}
              width={map.width}
              height={map.height}
            />
          </div>
        </div>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        {SCORE_BANDS.map((band) => (
          <li key={band.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-sm"
              style={{ background: band.color }}
            />
            {band.label}
          </li>
        ))}
        {map.unknownCount > 0 && (
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-sm border border-dashed border-muted"
            />
            {formatNumber(map.unknownCount)} sin datos
          </li>
        )}
      </ul>
    </div>
  );
}
