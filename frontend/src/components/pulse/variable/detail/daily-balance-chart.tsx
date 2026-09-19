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
import {
  BalanceAxis,
  BalanceGuideLine,
  BalanceMark,
  type BalanceGuide,
} from '@/components/pulse/variable/detail/balance-marks';
import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { formatEuro } from '@/lib/format';
import type { DailyBalancePoint } from '@/lib/pulse/details/types';

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
  const markAt =
    mark && mark.balance !== null && markIndex >= 0
      ? { x: xAt(markIndex, count, box), y: yAt(mark.balance, min, max, box) }
      : null;

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
        <BalanceAxis
          box={box}
          max={max}
          min={min}
          bottom={bottom}
          days={[daily[0].day, lastDay.day]}
        />
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
        {guide && (
          <BalanceGuideLine
            box={box}
            guide={guide}
            y={yAt(guide.value, min, max, box)}
          />
        )}
        {mark && markAt && (
          <BalanceMark box={box} point={mark} at={markAt} bottom={bottom} />
        )}
        <text
          x={box.width - box.padRight}
          y={Math.max(last.y - 8, box.padTop - 6)}
          textAnchor="end"
          className="fill-foreground text-[11px] font-medium tabular-nums"
        >
          {formatEuro(lastDay.balance)}
        </text>
      </svg>
    </div>
  );
}
