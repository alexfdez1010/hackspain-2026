'use client';

import { useMemo, useState } from 'react';

import { linePath, type ChartBox } from '@/components/charts/geometry';
import { ScoreGuides } from '@/components/charts/score-guides';
import {
  TrajectoryHover,
  TrajectoryTooltip,
} from '@/components/charts/trajectory-tooltip';
import { useElementWidth } from '@/components/charts/use-element-width';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';
import { layoutTrajectory } from '@/lib/pulse/trajectory-layout';
import { formatMonth, formatMonthShort, formatNumber } from '@/lib/format';
import { scoreColor } from '@/lib/score';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 288,
  padLeft: 28,
  padRight: 34,
  padTop: 22,
  padBottom: 28,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 960;

interface PulseTrajectoryChartProps {
  /** Observed months followed by the forecast horizons. */
  points: readonly PulseTrajectoryPoint[];
  /** Index of the last observed month; `-1` when there is no history. */
  boundaryIndex: number;
}

/**
 * Draws the monthly PULSE history and the six-month forecast on one axis.
 *
 * The chart fills its container: the SVG takes the measured width as its
 * viewBox, so the text keeps a real pixel size. The observed line is solid and
 * the forecast dashed, separated by the mark at the last close; the shaded
 * area is the p10-p90 band. Hovering or focusing a month opens a tooltip
 * with its value, and the last close and the farthest horizon stay printed.
 *
 * @param props - The merged trajectory and its boundary.
 * @returns The chart, or an empty state when there is no history.
 */
export function PulseTrajectoryChart({
  points,
  boundaryIndex,
}: PulseTrajectoryChartProps) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const [activeIndex, setActiveIndex] = useState(-1);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);
  const layout = useMemo(
    () => layoutTrajectory(points, boundaryIndex, box),
    [points, boundaryIndex, box],
  );
  const count = points.length;
  if (count === 0 || boundaryIndex < 0) {
    return <p className="text-sm text-muted">Sin historial mensual.</p>;
  }

  const { placed, observed, projected, band, labelStep } = layout;
  const last = placed[count - 1];
  const boundary = placed[boundaryIndex];
  const stroke = scoreColor(boundary.value);
  const forecastStroke = scoreColor(last.value);
  const active = placed[activeIndex];

  return (
    <figure className="flex flex-col gap-2">
      <div ref={container} className="relative w-full">
        <svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          width="100%"
          height={box.height}
          className="block"
          role="img"
          aria-label={`PULSE mensual desde ${formatMonth(points[0].month)} hasta ${formatMonth(boundary.month)} y previsión hasta ${formatMonth(last.month)}`}
        >
          <ScoreGuides box={box} />
          {band && <path d={band} fill={forecastStroke} fillOpacity={0.16} />}
          <path
            d={linePath(observed)}
            fill="none"
            stroke={stroke}
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d={linePath(projected)}
            fill="none"
            stroke={forecastStroke}
            strokeWidth={2}
            strokeDasharray="6 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <line
            x1={boundary.x}
            x2={boundary.x}
            y1={box.padTop}
            y2={box.height - box.padBottom}
            stroke="var(--foreground)"
            strokeWidth={1.2}
            strokeDasharray="3 3"
            opacity={0.45}
          />
          <text
            x={boundary.x + 4}
            y={box.padTop - 8}
            className="fill-muted text-[10px]"
          >
            previsión
          </text>
          {boundary.y !== null && (
            <g>
              <circle cx={boundary.x} cy={boundary.y} r={3.6} fill={stroke} />
              <text
                x={boundary.x - 6}
                y={boundary.y - 9}
                textAnchor="end"
                className="text-[11px] font-medium tabular-nums"
                fill={stroke}
              >
                {formatNumber(boundary.value, 1)}
              </text>
            </g>
          )}
          {last.y !== null && boundaryIndex < count - 1 && (
            <g>
              <circle cx={last.x} cy={last.y} r={3.2} fill={forecastStroke} />
              <text
                x={last.x}
                y={last.y - 9}
                textAnchor="end"
                className="text-[11px] font-medium tabular-nums"
                fill={forecastStroke}
              >
                {formatNumber(last.value, 1)}
              </text>
            </g>
          )}
          {placed.map((point, index) =>
            index % labelStep === 0 ||
            index === count - 1 ||
            index === boundaryIndex ? (
              <text
                key={`label-${point.month}`}
                x={point.x}
                y={box.height - 8}
                textAnchor="middle"
                className="fill-muted text-[10px]"
              >
                {formatMonthShort(point.month)}
              </text>
            ) : null,
          )}
          <TrajectoryHover
            placed={placed}
            activeIndex={activeIndex}
            box={box}
            onHover={setActiveIndex}
            onLeave={() => setActiveIndex(-1)}
          />
        </svg>
        {active && <TrajectoryTooltip point={active} box={box} />}
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>Línea continua: PULSE observado.</span>
        <span>Discontinua: previsión +1 a +12 meses.</span>
        <span>Área: banda p10-p90.</span>
        <span>Pasa el ratón o el foco por un mes para ver su valor.</span>
      </figcaption>
    </figure>
  );
}
