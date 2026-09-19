'use client';

import { useMemo } from 'react';

import { yAt, type ChartBox } from '@/components/charts/geometry';
import { useElementWidth } from '@/components/charts/use-element-width';
import {
  EmptySlot,
  MonthAxis,
  MonthBar,
  monthSlot,
} from '@/components/charts/variable/month-bars';
import { formatMonth, formatNumber } from '@/lib/format';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseVariablePoint } from '@/lib/pulse/variable-series';
import { scoreColor } from '@/lib/score';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 200,
  padLeft: 34,
  padRight: 14,
  padTop: 26,
  padBottom: 26,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 960;

interface VariableContributionChartProps {
  /** One point per observed month, ascending. */
  points: readonly PulseVariablePoint[];
  /** Points of PULSE the variable can reach: its weight. */
  weight: number;
  /** Name of the variable, used in the accessible label. */
  label?: string;
}

/**
 * Shows how much of its weight the variable earns each month.
 *
 * The axis runs from zero to the weight and the guide at the top is the
 * maximum, so the empty space above a bar is the part of those points the
 * company is not getting. A month with no evidence earns nothing and
 * contributes nothing, but it is drawn as an empty slot, not as a zero bar.
 *
 * @param props - The observed months, the weight of the variable and its name.
 * @returns The chart, or an empty state when no month carries points.
 */
export function VariableContributionChart({
  points,
  weight,
  label,
}: VariableContributionChartProps) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);

  const count = points.length;
  const drawn = points.filter((point) => point.contribution !== null);
  const last = drawn[drawn.length - 1] ?? null;
  if (last === null || last.contribution === null) {
    return (
      <p className="text-sm text-muted">
        Sin meses con datos para esta variable.
      </p>
    );
  }
  const lastIndex = points.indexOf(last);
  const top = Math.max(weight, 1);
  const baseline = yAt(0, 0, top, box);
  const maxY = yAt(top, 0, top, box);
  const lastSlot = monthSlot(lastIndex, count, box);

  return (
    <figure className="flex flex-col gap-2">
      <div ref={container} className="w-full">
        <svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          width="100%"
          height={box.height}
          className="block"
          role="img"
          aria-label={`${label ?? 'La variable'}: puntos aportados al PULSE desde ${formatMonth(points[0].month)} hasta ${formatMonth(points[count - 1].month)}; último valor ${formatNumber(last.contribution, 2)} de un máximo de ${formatNumber(weight)} puntos`}
        >
          <g aria-hidden="true">
            <line
              x1={box.padLeft}
              x2={box.width - box.padRight}
              y1={maxY}
              y2={maxY}
              stroke="var(--foreground)"
              strokeWidth={1}
              opacity={0.45}
            />
            <text
              x={box.padLeft}
              y={maxY - 6}
              className="fill-muted text-[10px] tabular-nums"
            >
              máximo: {formatNumber(weight)} pts
            </text>
            <line
              x1={box.padLeft}
              x2={box.width - box.padRight}
              y1={baseline}
              y2={baseline}
              stroke="var(--separator)"
              strokeWidth={1}
            />
            <text
              x={box.padLeft - 6}
              y={baseline + 3}
              textAnchor="end"
              className="fill-muted text-[10px] tabular-nums"
            >
              0
            </text>
          </g>
          {points.map((point, index) => {
            const slot = monthSlot(index, count, box);
            if (point.contribution === null) {
              return (
                <EmptySlot
                  key={point.month}
                  slot={slot}
                  box={box}
                  title={`${formatMonth(point.month)}: ${UNKNOWN_TEXT}`}
                />
              );
            }
            const y = yAt(point.contribution, 0, top, box);
            return (
              <MonthBar
                key={point.month}
                slot={slot}
                y={y}
                height={baseline - y}
                color={scoreColor(point.score)}
                stripAt="top"
                title={`${formatMonth(point.month)}: ${formatNumber(point.contribution, 2)} pts de ${formatNumber(weight)}`}
              />
            );
          })}
          <text
            x={lastSlot.x + lastSlot.width}
            y={yAt(last.contribution, 0, top, box) - 6}
            textAnchor="end"
            className="fill-foreground text-[11px] font-medium tabular-nums"
          >
            {formatNumber(last.contribution, 2)} pts
          </text>
          <MonthAxis months={points.map((point) => point.month)} box={box} />
        </svg>
      </div>
      <figcaption className="text-xs text-muted">
        Cada barra son los puntos del PULSE que aporta la variable ese mes.
      </figcaption>
    </figure>
  );
}
