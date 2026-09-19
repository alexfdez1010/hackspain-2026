import type { ChartBox } from '@/components/charts/geometry';
import { formatMonthShort } from '@/lib/format';
import { labelIndices, labelStep } from '@/lib/pulse/trajectory-layout';

/** Share of a month slot taken by its bar; the rest is the gap. */
const BAR_RATIO = 0.62;
/** Thickness of the solid strip drawn on the value end of a bar. */
const STRIP = 3;
/** Opacity of the body of a bar, as in the cells of the heat map. */
const BODY_OPACITY = 0.24;

/** Horizontal geometry of one month of a monthly bar chart. */
export interface MonthSlot {
  /** Centre of the slot. */
  center: number;
  /** Left edge of the bar. */
  x: number;
  /** Width of the bar. */
  width: number;
  /** Width of the whole slot, bar and gap. */
  slot: number;
}

/**
 * Splits the plot area into one slot per month and centres a bar in each.
 *
 * @param index - Zero-based position of the month.
 * @param count - Number of months drawn.
 * @param box - Chart box.
 * @returns The geometry of the month.
 */
export function monthSlot(
  index: number,
  count: number,
  box: ChartBox,
): MonthSlot {
  const inner = box.width - box.padLeft - box.padRight;
  const slot = count > 0 ? inner / count : inner;
  const center = box.padLeft + slot * (index + 0.5);
  const width = Math.max(slot * BAR_RATIO, 2);
  return { center, x: center - width / 2, width, slot };
}

interface MonthBarProps {
  slot: MonthSlot;
  /** Top edge of the bar. */
  y: number;
  height: number;
  /** Colour of the band of the month. */
  color: string;
  /** Edge the value reaches, where the solid strip is drawn. */
  stripAt: 'top' | 'bottom';
  /** Read out by assistive technology and shown as the native tooltip. */
  title: string;
}

/**
 * Draws the figure of one month as a bar tinted with its band.
 *
 * The body is washed and a solid strip marks the end the value reaches, the
 * same pair the heat map uses, so the colour stays readable as a band and the
 * exact height of the bar keeps a hard edge.
 *
 * @param props - Slot geometry, vertical extent, colour and description.
 * @returns The group of SVG elements of one bar.
 */
export function MonthBar({
  slot,
  y,
  height,
  color,
  stripAt,
  title,
}: MonthBarProps) {
  const strip = Math.min(STRIP, Math.max(height, 1));
  return (
    <g>
      <title>{title}</title>
      <rect
        x={slot.x}
        y={y}
        width={slot.width}
        height={Math.max(height, 1)}
        fill={color}
        fillOpacity={BODY_OPACITY}
      />
      <rect
        x={slot.x}
        y={stripAt === 'top' ? y : y + Math.max(height, 1) - strip}
        width={slot.width}
        height={strip}
        fill={color}
      />
    </g>
  );
}

interface MonthAxisProps {
  /** Months drawn, ascending. */
  months: readonly string[];
  box: ChartBox;
}

/**
 * Names the months under the bars, as often as the width allows.
 *
 * @param props - The months and the chart box.
 * @returns The labels of the horizontal axis.
 */
export function MonthAxis({ months, box }: MonthAxisProps) {
  const count = months.length;
  const centers = months.map((_, index) => monthSlot(index, count, box).center);
  const printed = labelIndices(
    centers,
    count - 1,
    labelStep(count, box.width - box.padLeft - box.padRight),
  );
  return (
    <g aria-hidden="true">
      {months.map((month, index) =>
        printed.has(index) ? (
          <text
            key={month}
            x={centers[index]}
            y={box.height - 8}
            textAnchor="middle"
            className="fill-muted text-[10px]"
          >
            {formatMonthShort(month)}
          </text>
        ) : null,
      )}
    </g>
  );
}

interface EmptySlotProps {
  slot: MonthSlot;
  box: ChartBox;
  title: string;
}

/**
 * Marks a month with no evidence as an empty slot with a dashed outline.
 *
 * The slot keeps the month on the axis without giving it a height: a variable
 * that was not measured is not a variable that measured zero.
 *
 * @param props - Slot geometry, chart box and description.
 * @returns The dashed outline of one month.
 */
export function EmptySlot({ slot, box, title }: EmptySlotProps) {
  const top = box.padTop;
  const height = box.height - box.padTop - box.padBottom;
  return (
    <g>
      <title>{title}</title>
      <rect
        x={slot.x}
        y={top}
        width={slot.width}
        height={height}
        fill="none"
        stroke="var(--muted)"
        strokeOpacity={0.5}
        strokeDasharray="4 3"
      />
    </g>
  );
}
