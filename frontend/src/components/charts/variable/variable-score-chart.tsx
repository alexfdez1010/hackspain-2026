'use client';

import { useMemo, useState } from 'react';

import {
  areaPath,
  linePath,
  type ChartBox,
} from '@/components/charts/geometry';
import { ScoreGuides } from '@/components/charts/score-guides';
import {
  TrajectoryHover,
  TrajectoryTooltip,
} from '@/components/charts/trajectory-tooltip';
import { useElementWidth } from '@/components/charts/use-element-width';
import {
  referencePaths,
  segments,
  toTrajectory,
} from '@/components/charts/variable/score-layout';
import { layoutTrajectory } from '@/lib/pulse/trajectory-layout';
import type { PulseVariablePoint } from '@/lib/pulse/variable-series';
import { formatMonth, formatMonthShort, formatNumber } from '@/lib/format';
import { scoreColor } from '@/lib/score';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 260,
  padLeft: 28,
  padRight: 34,
  padTop: 22,
  padBottom: 26,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 960;

interface VariableScoreChartProps {
  /** One point per observed month, ascending. */
  points: readonly PulseVariablePoint[];
  /** Name of the variable, as the export publishes it. */
  label: string;
  /** Name of the pillar the variable feeds. */
  pillarLabel: string;
}

/**
 * Draws the monthly score of one variable against its pillar and the PULSE.
 *
 * The three lines share the 0-100 scale and the band guides, so the reader
 * sees at once whether the variable is pulling the score up or down. Months
 * with no evidence break the line instead of falling to zero, and hovering,
 * tapping or focusing a month opens its value.
 *
 * @param props - The observed months and the names of the variable and pillar.
 * @returns The chart, or an empty state when no month carries a score.
 */
export function VariableScoreChart({
  points,
  label,
  pillarLabel,
}: VariableScoreChartProps) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const [activeIndex, setActiveIndex] = useState(-1);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);
  const trajectory = useMemo(() => toTrajectory(points), [points]);
  const layout = useMemo(
    () => layoutTrajectory(trajectory, trajectory.length - 1, box),
    [trajectory, box],
  );
  const pillarLine = useMemo(
    () =>
      referencePaths(
        points.map((point) => point.pillarScore),
        box,
      ),
    [points, box],
  );
  const pulseLine = useMemo(
    () =>
      referencePaths(
        points.map((point) => point.pulse),
        box,
      ),
    [points, box],
  );

  const { placed, labels } = layout;
  const last = [...placed].reverse().find((point) => point.y !== null);
  if (!last || last.y === null || last.value === null) {
    return (
      <p className="text-sm text-muted">
        Sin meses con datos para esta variable.
      </p>
    );
  }
  const color = scoreColor(last.value);
  const baseline = box.height - box.padBottom;
  const runs = segments(placed);
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
          aria-label={`${label}: score mensual desde ${formatMonth(points[0].month)} hasta ${formatMonth(points[points.length - 1].month)}; último valor ${formatNumber(last.value, 1)} sobre 100`}
        >
          <ScoreGuides box={box} />
          {pillarLine.map((path, index) => (
            <path
              key={`pillar-${index}`}
              d={path}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={1}
              strokeDasharray="5 3"
              opacity={0.55}
            />
          ))}
          {pulseLine.map((path, index) => (
            <path
              key={`pulse-${index}`}
              d={path}
              fill="none"
              stroke="var(--muted)"
              strokeWidth={1}
              strokeDasharray="1 3"
              opacity={0.55}
            />
          ))}
          {runs.map((run) => (
            <path
              key={`area-${run[0].x}`}
              d={areaPath(run, baseline)}
              fill={color}
              fillOpacity={0.14}
            />
          ))}
          {runs.map((run) => (
            <path
              key={`line-${run[0].x}`}
              d={linePath(run)}
              fill="none"
              stroke={color}
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          <circle cx={last.x} cy={last.y} r={3.6} fill={color} />
          <text
            x={last.x - 6}
            y={last.y - 9}
            textAnchor="end"
            className="text-[11px] font-medium tabular-nums"
            fill={color}
          >
            {formatNumber(last.value, 1)}
          </text>
          {placed.map((point, index) =>
            labels.has(index) ? (
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
        <span>Línea continua: {label}.</span>
        <span>Discontinua: {pillarLabel}.</span>
        <span>Punteada: PULSE.</span>
        <span>Toca o pasa el ratón por un mes para ver su valor.</span>
      </figcaption>
    </figure>
  );
}
