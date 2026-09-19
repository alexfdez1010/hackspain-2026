'use client';

import { useMemo } from 'react';
import {
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import { ScoreGuides } from '@/components/charts/score-guides';
import { BRAND_BLUE } from '@/components/charts/tokens';
import { useElementWidth } from '@/components/charts/use-element-width';
import { segments } from '@/components/charts/variable/score-layout';
import type { CompareSeries } from '@/lib/assistant/charts/types';
import { formatMonth, formatMonthShort, formatNumber } from '@/lib/format';
import { labelIndices, labelStep } from '@/lib/pulse/trajectory-layout';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 200,
  padLeft: 22,
  padRight: 8,
  padTop: 12,
  padBottom: 24,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 380;

/**
 * Identity of up to four series without a fourth hue: the product colours
 * only score and direction, so the lines differ by ink and dash instead.
 */
const STYLES = [
  { stroke: BRAND_BLUE, dash: undefined },
  { stroke: 'var(--foreground)', dash: undefined },
  { stroke: BRAND_BLUE, dash: '5 4' },
  { stroke: 'var(--foreground)', dash: '2 3' },
] as const;

/**
 * Two to four variable scores on the same months and the same 0-100 axis.
 *
 * Every series is direct-labelled at its last month and listed in a legend
 * with its line sample, so identity never rests on colour alone. Months with
 * no evidence break the line instead of falling to zero.
 *
 * @param props - The series to compare.
 * @returns The chart with its legend.
 */
export function CompareLines({ series }: { series: readonly CompareSeries[] }) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);
  const months = series[0]?.points.map((point) => point.month) ?? [];
  const count = months.length;
  const placed = series.map((item) =>
    item.points.map((point, index) => ({
      x: xAt(index, count, box),
      y: point.value === null ? null : yAt(point.value, 0, 100, box),
    })),
  );
  const labels = labelIndices(
    months.map((_, index) => xAt(index, count, box)),
    count - 1,
    labelStep(count, box.width - box.padLeft - box.padRight),
  );
  if (count === 0) {
    return <p className="text-xs text-muted">Sin meses observados.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <div ref={container} className="w-full">
        <svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          width="100%"
          height={box.height}
          className="block"
          role="img"
          aria-label={`${series.map((s) => s.label).join(', ')} desde ${formatMonth(months[0])} hasta ${formatMonth(months[count - 1])}`}
        >
          <ScoreGuides box={box} />
          {placed.map((points, index) => {
            const style = STYLES[index % STYLES.length];
            const last = [...points]
              .reverse()
              .find((point) => point.y !== null);
            return (
              <g key={series[index].key}>
                {segments(points).map((run) => (
                  <path
                    key={`${run[0].x}`}
                    d={linePath(run)}
                    fill="none"
                    stroke={style.stroke}
                    strokeWidth={2}
                    strokeDasharray={style.dash}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}
                {last && last.y !== null ? (
                  <circle cx={last.x} cy={last.y} r={3} fill={style.stroke} />
                ) : null}
              </g>
            );
          })}
          {months.map((month, index) =>
            labels.has(index) ? (
              <text
                key={month}
                x={xAt(index, count, box)}
                y={box.height - 8}
                textAnchor="middle"
                className="fill-muted text-[10px]"
              >
                {formatMonthShort(month)}
              </text>
            ) : null,
          )}
        </svg>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {series.map((item, index) => {
          const style = STYLES[index % STYLES.length];
          const last = [...item.points].reverse().find((p) => p.value !== null);
          return (
            <li key={item.key} className="flex items-center gap-1.5">
              <svg
                aria-hidden="true"
                width="18"
                height="6"
                className="shrink-0"
              >
                <line
                  x1="0"
                  y1="3"
                  x2="18"
                  y2="3"
                  stroke={style.stroke}
                  strokeWidth="2"
                  strokeDasharray={style.dash}
                />
              </svg>
              <span className="text-foreground">{item.label}</span>
              <span className="tabular-nums">
                {formatNumber(last?.value ?? null, 1)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
