import type { ChartBox } from '@/components/charts/geometry';
import { formatEuro } from '@/lib/format';
import type { DailyBalancePoint } from '@/lib/pulse/details/types';
import { formatDay } from '@/lib/pulse/details/view';

/** A horizontal reference drawn across the plot. */
export interface BalanceGuide {
  /** Level of the reference, in euros. */
  value: number;
  /** What the reference stands for, printed on the line. */
  label: string;
}

interface BalanceAxisProps {
  box: ChartBox;
  /** Top of the value domain, in euros. */
  max: number;
  /** Bottom of the value domain: zero, or the deepest negative balance. */
  min: number;
  /** Y coordinate of the bottom of the domain. */
  bottom: number;
  /** First and last day drawn, as ISO days. */
  days: readonly [string, string];
}

/**
 * Labels the two ends of the value axis and the two ends of the time axis.
 *
 * Only the ends are printed: the chart answers «how much cash and when», and
 * intermediate gridlines would add ink without adding a reading.
 *
 * @param props - Chart box, value domain, baseline and the outer days.
 * @returns The axis of the daily balance chart.
 */
export function BalanceAxis({ box, max, min, bottom, days }: BalanceAxisProps) {
  const right = box.width - box.padRight;
  return (
    <g aria-hidden="true">
      <text
        x={box.padLeft - 8}
        y={box.padTop + 4}
        textAnchor="end"
        className="fill-muted text-[10px] tabular-nums"
      >
        {formatEuro(max)}
      </text>
      <text
        x={box.padLeft - 8}
        y={bottom + 4}
        textAnchor="end"
        className="fill-muted text-[10px] tabular-nums"
      >
        {formatEuro(min)}
      </text>
      <line
        x1={box.padLeft}
        x2={right}
        y1={bottom}
        y2={bottom}
        stroke="var(--separator)"
        strokeWidth={1}
      />
      <text
        x={box.padLeft}
        y={box.height - 8}
        className="fill-muted text-[10px]"
      >
        {formatDay(days[0])}
      </text>
      <text
        x={right}
        y={box.height - 8}
        textAnchor="end"
        className="fill-muted text-[10px]"
      >
        {formatDay(days[1])}
      </text>
    </g>
  );
}

interface BalanceGuideLineProps {
  box: ChartBox;
  guide: BalanceGuide;
  /** Y coordinate of the reference. */
  y: number;
}

/**
 * Draws the dashed reference the cash is measured against.
 *
 * @param props - Chart box, the reference and where it sits.
 * @returns The line with its label.
 */
export function BalanceGuideLine({ box, guide, y }: BalanceGuideLineProps) {
  const right = box.width - box.padRight;
  return (
    <g>
      <line
        x1={box.padLeft}
        x2={right}
        y1={y}
        y2={y}
        stroke="var(--foreground)"
        strokeWidth={1}
        strokeDasharray="5 4"
        opacity={0.55}
      />
      <text
        x={right}
        y={y - 5}
        textAnchor="end"
        className="fill-muted text-[10px]"
      >
        {guide.label}: {formatEuro(guide.value)}
      </text>
    </g>
  );
}

interface BalanceMarkProps {
  box: ChartBox;
  /** The day being marked. */
  point: DailyBalancePoint;
  /** Where the day sits in the plot. */
  at: { x: number; y: number };
  /** Y coordinate of the baseline, so the label never falls out of the plot. */
  bottom: number;
}

/**
 * Marks one day of the series with a dot and names it.
 *
 * @param props - Chart box, the day, its position and the baseline.
 * @returns The dot and its label.
 */
export function BalanceMark({ box, point, at, bottom }: BalanceMarkProps) {
  const toLeft = at.x > box.width / 2;
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={3.6} fill="var(--foreground)" />
      <text
        x={at.x + (toLeft ? -6 : 6)}
        y={Math.min(at.y + 15, bottom - 3)}
        textAnchor={toLeft ? 'end' : 'start'}
        className="fill-foreground text-[11px] font-medium tabular-nums"
      >
        mínimo: {formatDay(point.day)}, {formatEuro(point.balance)}
      </text>
    </g>
  );
}
