'use client';

import { useMemo } from 'react';

import { yAt, type ChartBox } from '@/components/charts/geometry';
import { useElementWidth } from '@/components/charts/use-element-width';
import {
  MonthAxis,
  MonthBar,
  monthSlot,
} from '@/components/charts/variable/month-bars';
import { DetailNote } from '@/components/pulse/variable/detail/detail-note';
import { formatEuro, formatMonth, formatNumber } from '@/lib/format';
import type { DetailMonth } from '@/lib/pulse/details/types';

/** Fixed pixel geometry; the width is measured from the container. */
const BASE: Omit<ChartBox, 'width'> = {
  height: 208,
  padLeft: 64,
  padRight: 16,
  padTop: 20,
  padBottom: 40,
};
/** Width assumed before the container is measured. */
const FALLBACK_WIDTH = 960;

interface MonthMinBarsProps {
  /** Months of the `cash_min` block, ascending. */
  months: readonly DetailMonth[];
}

/**
 * Compares the cash at the close of each month with the worst day inside it.
 *
 * The bar is the close, the horizontal mark is the minimum: the gap between
 * them is what a month-end snapshot hides, which is the whole reason the
 * variable reads the minimum and not the close.
 *
 * @param props - The months of the block.
 * @returns The small multiple, or a note when no month carries cash.
 */
export function MonthMinBars({ months }: MonthMinBarsProps) {
  const [container, width] = useElementWidth<HTMLDivElement>(FALLBACK_WIDTH);
  const box = useMemo<ChartBox>(() => ({ ...BASE, width }), [width]);
  const levels = months.flatMap((row) =>
    [row.values.cashEnd, row.values.cashMin].filter(
      (value): value is number => value !== null,
    ),
  );
  if (levels.length === 0) {
    return <DetailNote>Sin caja mensual registrada.</DetailNote>;
  }

  const count = months.length;
  const max = Math.max(...levels);
  const min = Math.min(0, ...levels);
  const bottom = yAt(min, min, max, box);

  return (
    <figure className="flex flex-col gap-2">
      <div ref={container} className="w-full">
        <svg
          viewBox={`0 0 ${box.width} ${box.height}`}
          width="100%"
          height={box.height}
          className="block"
          role="img"
          aria-label={`Caja al cierre y peor día de cada mes, de ${formatMonth(months[0].month)} a ${formatMonth(months[count - 1].month)}`}
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
            <line
              x1={box.padLeft}
              x2={box.width - box.padRight}
              y1={bottom}
              y2={bottom}
              stroke="var(--separator)"
              strokeWidth={1}
            />
          </g>
          {months.map((row, index) => {
            const slot = monthSlot(index, count, box);
            const close = row.values.cashEnd;
            const low = row.values.cashMin;
            const ratio = row.values.ratio;
            const y = close === null ? bottom : yAt(close, min, max, box);
            return (
              <g key={row.month}>
                {close !== null && (
                  <MonthBar
                    slot={slot}
                    y={y}
                    height={bottom - y}
                    color="var(--foreground)"
                    stripAt="top"
                    title={`${formatMonth(row.month)}: cierre ${formatEuro(close)}, mínimo ${formatEuro(low)}, ${formatNumber(ratio, 2)} salidas mensuales`}
                  />
                )}
                {low !== null && (
                  <line
                    x1={slot.x}
                    x2={slot.x + slot.width}
                    y1={yAt(low, min, max, box)}
                    y2={yAt(low, min, max, box)}
                    stroke="var(--foreground)"
                    strokeWidth={2}
                  />
                )}
                <text
                  x={slot.center}
                  y={box.height - 22}
                  textAnchor="middle"
                  className="fill-muted text-[10px] tabular-nums"
                >
                  {formatNumber(ratio, 2)}
                </text>
              </g>
            );
          })}
          <MonthAxis months={months.map((row) => row.month)} box={box} />
        </svg>
      </div>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>Barra: caja al cierre del mes.</span>
        <span>Marca: saldo del peor día de ese mes.</span>
        <span>Cifra bajo el mes: el mínimo en salidas mensuales.</span>
      </figcaption>
    </figure>
  );
}
