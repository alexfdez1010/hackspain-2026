import type { ChartBox } from '@/components/charts/geometry';
import { TrajectoryTooltipSignal } from '@/components/charts/trajectory-tooltip-signal';
import type { PlacedTrajectoryPoint } from '@/lib/pulse/trajectory-layout';
import type { PulseSignal } from '@/lib/pulse/types';
import { formatBand } from '@/lib/pulse/format';
import { formatMonth, formatNumber } from '@/lib/format';
import { scoreBand } from '@/lib/score';

/** Width of the tooltip card, used to keep it inside the chart. */
const CARD_WIDTH = 176;
/** Width of the card when it also explains a signal. */
const SIGNAL_CARD_WIDTH = 288;
/** Gap between the point and the card. */
const GAP = 14;

interface TrajectoryTooltipProps {
  point: PlacedTrajectoryPoint;
  box: ChartBox;
  /** Signal that opened on the hovered month, when the month carries one. */
  signal?: PulseSignal;
}

/**
 * Describes one month of the trajectory next to its point.
 *
 * Rendered as HTML over the SVG, in the inverted foreground/background pair
 * so the card reads on any chart colour, in light and dark themes alike. It
 * stays inside the chart horizontally and flips under the point near the top.
 * A month flagged with a signal widens the card and adds the signal block,
 * so the triangle is explained where the pointer already is.
 *
 * @param props - The hovered point, the chart box and the month's signal.
 * @returns The positioned card, or nothing for a month without score.
 */
export function TrajectoryTooltip({
  point,
  box,
  signal,
}: TrajectoryTooltipProps) {
  if (point.y === null || point.value === null) return null;
  const band = scoreBand(point.value);
  const width = signal ? SIGNAL_CARD_WIDTH : CARD_WIDTH;
  const left = Math.min(
    Math.max(point.x - width / 2, 0),
    Math.max(box.width - width, 0),
  );
  const above = point.y > box.padTop + 72;
  const forecast = point.kind === 'forecast';
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 flex flex-col gap-0.5 rounded-lg bg-foreground px-3 py-2 text-background shadow-lg"
      style={{
        width,
        left,
        top: above ? undefined : point.y + GAP,
        bottom: above ? box.height - point.y + GAP : undefined,
      }}
    >
      <span className="text-xs font-medium">
        {formatMonth(point.month)}
        {forecast && <span className="opacity-70"> · previsto</span>}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tabular-nums">
          {formatNumber(point.value, 1)}
        </span>
        <span className="flex items-center gap-1.5 text-xs">
          <span
            aria-hidden
            className="inline-block size-2 rounded-full"
            style={{ background: band.color }}
          />
          {band.label}
        </span>
      </span>
      {forecast && (
        <span className="text-xs tabular-nums opacity-80">
          Banda p10-p90: {formatBand(point.p10, point.p90)}
        </span>
      )}
      {signal && <TrajectoryTooltipSignal signal={signal} />}
    </div>
  );
}

interface TrajectoryHoverProps {
  placed: readonly PlacedTrajectoryPoint[];
  activeIndex: number;
  box: ChartBox;
  onHover: (index: number) => void;
  onLeave: () => void;
}

/**
 * The invisible hit columns and the highlight of the hovered month.
 *
 * Each month owns a column of the plot, so a pointer anywhere on the chart
 * lights the closest month; the columns are focusable so the keyboard reaches
 * every value too.
 *
 * @param props - Placed points, active index, box and handlers.
 * @returns SVG elements to place on top of the lines.
 */
export function TrajectoryHover({
  placed,
  activeIndex,
  box,
  onHover,
  onLeave,
}: TrajectoryHoverProps) {
  const active = placed[activeIndex];
  const count = placed.length;
  const slot =
    count > 1
      ? placed[1].x - placed[0].x
      : box.width - box.padLeft - box.padRight;
  return (
    <g onMouseLeave={onLeave}>
      {active?.y !== null && active && (
        <g aria-hidden="true">
          <line
            x1={active.x}
            x2={active.x}
            y1={box.padTop}
            y2={box.height - box.padBottom}
            stroke="var(--foreground)"
            strokeWidth={1}
            opacity={0.35}
          />
          <circle
            cx={active.x}
            cy={active.y}
            r={5.5}
            fill="var(--background)"
            stroke={scoreBand(active.value).color}
            strokeWidth={2.5}
          />
        </g>
      )}
      {placed.map((point) => (
        <rect
          key={point.month}
          x={point.x - slot / 2}
          y={0}
          width={slot}
          height={box.height}
          fill="transparent"
          tabIndex={point.value === null ? -1 : 0}
          aria-label={
            point.value === null
              ? `${formatMonth(point.month)}: sin score`
              : `${formatMonth(point.month)}: ${formatNumber(point.value, 1)}${point.kind === 'forecast' ? ' previsto' : ''}`
          }
          onMouseEnter={() => onHover(point.index)}
          onFocus={() => onHover(point.index)}
          onBlur={onLeave}
        />
      ))}
    </g>
  );
}
