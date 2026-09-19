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
import {
  formatTick,
  rawDomain,
  rawTicks,
} from '@/components/charts/variable/raw-axis';
import { directionText, type MethodDirection } from '@/lib/method/variables';
import { formatMonth } from '@/lib/format';
import { formatRawValue, UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulseVariablePoint } from '@/lib/pulse/variable-series';
import { scoreColor } from '@/lib/score';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 220,
  padLeft: 44,
  padRight: 14,
  padTop: 26,
  padBottom: 26,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 960;

interface VariableRawChartProps {
  /** One point per observed month, ascending. */
  points: readonly PulseVariablePoint[];
  /** Unit of the raw figure, as the export publishes it. */
  unit: string;
  /** Direction that reads as healthier; `null` when it is not documented. */
  better: MethodDirection | null;
  /** Name of the variable. */
  label: string;
}

/**
 * Draws the raw figure behind the score, month by month, in its own unit.
 *
 * The score says how the figure is read; this chart says what the figure is.
 * Each bar carries the colour of the band of its month, so a rising magnitude
 * that is getting worse cannot be mistaken for progress, and the zero axis is
 * drawn whenever the variable takes negative figures.
 *
 * @param props - The observed months, the unit, the direction and the name.
 * @returns The chart, or an empty state when no month carries a figure.
 */
export function VariableRawChart({
  points,
  unit,
  better,
  label,
}: VariableRawChartProps) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);
  const domain = useMemo(
    () =>
      rawDomain(
        points
          .map((point) => point.raw)
          .filter((raw): raw is number => raw !== null),
      ),
    [points],
  );

  const count = points.length;
  const drawn = points.filter((point) => point.raw !== null);
  const last = drawn[drawn.length - 1] ?? null;
  if (last === null) {
    return (
      <p className="text-sm text-muted">
        Sin meses con datos para esta variable.
      </p>
    );
  }
  const lastIndex = points.indexOf(last);
  const zeroY = yAt(0, domain.min, domain.max, box);
  const lastSlot = monthSlot(lastIndex, count, box);
  const note = [
    unit ? `Cifra en ${unit}.` : null,
    better ? `${directionText(better)}.` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(' ');

  return (
    <figure className="flex flex-col gap-2">
      <div ref={container} className="w-full">
        <svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          width="100%"
          height={box.height}
          className="block"
          role="img"
          aria-label={`${label}: cifra mensual desde ${formatMonth(points[0].month)} hasta ${formatMonth(points[count - 1].month)}; último valor ${formatRawValue(last.raw, unit)}`}
        >
          <g aria-hidden="true">
            {rawTicks(domain).map((tick) => {
              const y = yAt(tick, domain.min, domain.max, box);
              return (
                <g key={tick}>
                  <line
                    x1={box.padLeft}
                    x2={box.width - box.padRight}
                    y1={y}
                    y2={y}
                    stroke="var(--separator)"
                    strokeWidth={1}
                  />
                  <text
                    x={box.padLeft - 6}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-muted text-[10px] tabular-nums"
                  >
                    {formatTick(tick, unit)}
                  </text>
                </g>
              );
            })}
          </g>
          {points.map((point, index) => {
            const slot = monthSlot(index, count, box);
            if (point.raw === null) {
              return (
                <EmptySlot
                  key={point.month}
                  slot={slot}
                  box={box}
                  title={`${formatMonth(point.month)}: ${UNKNOWN_TEXT}`}
                />
              );
            }
            const y = yAt(point.raw, domain.min, domain.max, box);
            const up = point.raw >= 0;
            return (
              <MonthBar
                key={point.month}
                slot={slot}
                y={up ? y : zeroY}
                height={Math.abs(zeroY - y)}
                color={scoreColor(point.score)}
                stripAt={up ? 'top' : 'bottom'}
                title={`${formatMonth(point.month)}: ${formatRawValue(point.raw, unit)}`}
              />
            );
          })}
          {domain.signed && (
            <line
              x1={box.padLeft}
              x2={box.width - box.padRight}
              y1={zeroY}
              y2={zeroY}
              stroke="var(--foreground)"
              strokeWidth={1}
              opacity={0.45}
            />
          )}
          <text
            x={lastSlot.x + lastSlot.width}
            y={
              Math.min(yAt(last.raw ?? 0, domain.min, domain.max, box), zeroY) -
              6
            }
            textAnchor="end"
            className="fill-foreground text-[11px] font-medium tabular-nums"
          >
            {formatRawValue(last.raw, unit)}
          </text>
          <MonthAxis months={points.map((point) => point.month)} box={box} />
        </svg>
      </div>
      {note && <figcaption className="text-xs text-muted">{note}</figcaption>}
    </figure>
  );
}
