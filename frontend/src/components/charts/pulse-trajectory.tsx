'use client';

import { useMemo, useState } from 'react';

import { linePath, yAt, type ChartBox } from '@/components/charts/geometry';
import { BRAND_BLUE, BRAND_SKY, HAIRLINE } from '@/components/charts/tokens';
import { TrajectoryMarkers } from '@/components/charts/trajectory-markers';
import {
  TrajectoryHover,
  TrajectoryTooltip,
} from '@/components/charts/trajectory-tooltip';
import { useElementWidth } from '@/components/charts/use-element-width';
import type { PulseTrajectoryPoint } from '@/lib/pulse/company-view';
import { signalsByIndex } from '@/lib/pulse/signals';
import {
  layoutTrajectory,
  trajectoryDomain,
} from '@/lib/pulse/trajectory-layout';
import type { PulseSignal } from '@/lib/pulse/types';
import { formatMonth, formatMonthShort } from '@/lib/format';
import { SCORE_GUIDES } from '@/lib/score';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 220,
  padLeft: 26,
  padRight: 6,
  padTop: 14,
  padBottom: 24,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 960;

interface PulseTrajectoryChartProps {
  /** Observed months followed by the forecast horizons. */
  points: readonly PulseTrajectoryPoint[];
  /** Index of the last observed month; `-1` when there is no history. */
  boundaryIndex: number;
  /** Signals to flag on their month; none by default. */
  signals?: readonly PulseSignal[];
}

/**
 * Draws the monthly PULSE history and the forecast on one axis.
 *
 * Observed months are a solid brand-blue line with a dot on every close;
 * the forecast is a dashed sky line over its p10-p90 band, so a prediction can
 * never be read as a measurement. The only rules are the three band
 * boundaries; there is no vertical axis. Hovering, tapping or focusing a month
 * opens its value, and a triangle flags every month where a signal opened.
 *
 * @param props - The merged trajectory, its boundary and the signals.
 * @returns The chart, or an empty state when there is no history.
 */
export function PulseTrajectoryChart({
  points,
  boundaryIndex,
  signals = [],
}: PulseTrajectoryChartProps) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const [activeIndex, setActiveIndex] = useState(-1);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);
  const domain = useMemo(() => trajectoryDomain(points), [points]);
  const layout = useMemo(
    () => layoutTrajectory(points, boundaryIndex, box, domain),
    [points, boundaryIndex, box, domain],
  );
  const markers = useMemo(
    () =>
      signalsByIndex(
        points.map((point) => point.month),
        signals,
      ),
    [points, signals],
  );
  const count = points.length;
  if (count === 0 || boundaryIndex < 0) {
    return <p className="text-sm text-ink-secondary">Sin historial mensual.</p>;
  }

  const { placed, observed, projected, band, labels } = layout;
  const last = placed[count - 1];
  const boundary = placed[boundaryIndex];
  const active = placed[activeIndex];

  return (
    <div ref={container} className="relative w-full">
      <svg
        viewBox={`0 0 ${box.width} ${box.height}`}
        width="100%"
        height={box.height}
        className="block"
        role="img"
        aria-label={`PULSE mensual desde ${formatMonth(points[0].month)} hasta ${formatMonth(boundary.month)} y previsión hasta ${formatMonth(last.month)}`}
      >
        {SCORE_GUIDES.map((guide) => {
          const y = yAt(guide, domain.min, domain.max, box);
          return (
            <g key={guide}>
              <line
                x1={box.padLeft}
                x2={box.width}
                y1={y}
                y2={y}
                stroke={HAIRLINE}
                strokeWidth={1}
              />
              <text
                x={box.padLeft - 6}
                y={y + 3.5}
                textAnchor="end"
                fontSize={10.5}
                className="fill-muted"
              >
                {guide}
              </text>
            </g>
          );
        })}
        {band && <path d={band} fill={BRAND_SKY} fillOpacity={0.34} />}
        <path
          d={linePath(observed)}
          fill="none"
          stroke={BRAND_BLUE}
          strokeWidth={2.4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={linePath(projected)}
          fill="none"
          stroke={BRAND_SKY}
          strokeWidth={2}
          strokeDasharray="5 4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <line
          x1={boundary.x}
          x2={boundary.x}
          y1={box.padTop}
          y2={box.height - box.padBottom}
          stroke={HAIRLINE}
          strokeWidth={1}
        />
        <text
          x={boundary.x + 6}
          y={box.padTop + 9}
          fontSize={10.5}
          className="fill-muted"
        >
          previsión
        </text>
        {observed.map((point, index) => (
          <circle
            key={point.month}
            cx={point.x}
            cy={point.y}
            r={index === observed.length - 1 ? 4 : 3.5}
            fill={BRAND_BLUE}
          />
        ))}
        {placed.map((point, index) =>
          labels.has(index) ? (
            <text
              key={`label-${point.month}`}
              x={point.x}
              y={box.height - 6}
              textAnchor="middle"
              fontSize={10.5}
              className="fill-muted"
            >
              {formatMonthShort(point.month)}
            </text>
          ) : null,
        )}
        <TrajectoryMarkers placed={placed} signals={markers} />
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
  );
}
