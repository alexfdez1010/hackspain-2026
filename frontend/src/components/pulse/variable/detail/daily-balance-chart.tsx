'use client';

import { useMemo } from 'react';

import {
  areaPath,
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import { useElementWidth } from '@/components/charts/use-element-width';
import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { formatEuro } from '@/lib/format';
import type { DailyBalancePoint } from '@/lib/pulse/details/types';
import { formatDay } from '@/lib/pulse/details/view';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 224,
  padLeft: 64,
  padRight: 16,
  padTop: 24,
  padBottom: 26,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 960;

/** A horizontal reference drawn across the plot. */
export interface BalanceGuide {
  /** Level of the reference, in euros. */
  value: number;
  /** What the reference stands for, printed on the line. */
  label: string;
}

interface DailyBalanceChartProps {
  /** Close-of-day cash of the whole company, ascending. */
  daily: readonly DailyBalancePoint[];
  /** Dashed reference such as one month of operating outflow. */
  guide?: BalanceGuide | null;
  /** Day marked with a dot and its own label, such as the worst day. */
  mark?: DailyBalancePoint | null;
  /** Accessible name of the chart. */
  ariaLabel: string;
}

/**
 * Draws the close-of-day cash of the last two months as an area.
 *
 * The vertical axis starts at zero, or at the deepest negative balance, so
 * the height of the area is the cash itself and not a zoomed slice of it. The
 * dashed reference lets the reader count how many of those references the
 * area covers, which is the question the liquidity variables answer.
 *
 * @param props - The daily series, an optional reference, an optional marked
 * day and the accessible name.
 * @returns The chart, or a note when no day carries a balance.
 */
export function DailyBalanceChart({
  daily,
  guide = null,
  mark = null,
  ariaLabel,
}: DailyBalanceChartProps) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);
  const balances = daily.flatMap((point) =>
    point.balance === null ? [] : [point.balance],
  );
  if (balances.length === 0) {
    return (
      <DetailNote>Sin saldos diarios en los dos últimos meses.</DetailNote>
    );
  }

  const count = daily.length;
  const max = Math.max(...balances, guide?.value ?? Number.NEGATIVE_INFINITY);
  const min = Math.min(0, ...balances);
  const bottom = yAt(min, min, max, box);
  const placed = daily.flatMap((point, index) =>
    point.balance === null
      ? []
      : [{ x: xAt(index, count, box), y: yAt(point.balance, min, max, box) }],
  );
  const last = placed[placed.length - 1];
  const lastDay = daily[count - 1];
  const markIndex = mark ? daily.findIndex((day) => day.day === mark.day) : -1;
  const marked =
    mark && mark.balance !== null && markIndex >= 0
      ? { x: xAt(markIndex, count, box), y: yAt(mark.balance, min, max, box) }
      : null;
  const guideY = guide ? yAt(guide.value, min, max, box) : null;
  const right = box.width - box.padRight;

  return (
    <div ref={container} className="w-full">
      <svg
        viewBox={`0 0 ${box.width} ${box.height}`}
        width="100%"
        height={box.height}
        className="block"
        role="img"
        aria-label={ariaLabel}
      >
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
        </g>
        <path
          d={areaPath(placed, bottom)}
          fill="var(--foreground)"
          fillOpacity={0.1}
        />
        <path
          d={linePath(placed)}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {guide && guideY !== null && (
          <g>
            <line
              x1={box.padLeft}
              x2={right}
              y1={guideY}
              y2={guideY}
              stroke="var(--foreground)"
              strokeWidth={1}
              strokeDasharray="5 4"
              opacity={0.55}
            />
            <text
              x={right}
              y={guideY - 5}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              {guide.label}: {formatEuro(guide.value)}
            </text>
          </g>
        )}
        {marked && mark && (
          <g>
            <circle
              cx={marked.x}
              cy={marked.y}
              r={3.6}
              fill="var(--foreground)"
            />
            <text
              x={marked.x + (marked.x > box.width / 2 ? -6 : 6)}
              y={Math.min(marked.y + 15, bottom - 3)}
              textAnchor={marked.x > box.width / 2 ? 'end' : 'start'}
              className="fill-foreground text-[11px] font-medium tabular-nums"
            >
              mínimo: {formatDay(mark.day)}, {formatEuro(mark.balance)}
            </text>
          </g>
        )}
        <text
          x={right}
          y={Math.max(last.y - 8, box.padTop - 6)}
          textAnchor="end"
          className="fill-foreground text-[11px] font-medium tabular-nums"
        >
          {formatEuro(lastDay.balance)}
        </text>
        <g aria-hidden="true">
          <text
            x={box.padLeft}
            y={box.height - 8}
            className="fill-muted text-[10px]"
          >
            {formatDay(daily[0].day)}
          </text>
          <text
            x={right}
            y={box.height - 8}
            textAnchor="end"
            className="fill-muted text-[10px]"
          >
            {formatDay(lastDay.day)}
          </text>
        </g>
      </svg>
    </div>
  );
}
