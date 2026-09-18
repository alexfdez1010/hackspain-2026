import {
  areaPath,
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import { formatMonth, formatMonthShort } from '@/lib/xray/format';
import { scoreColor } from '@/lib/xray/score';
import type { MonthRecord } from '@/lib/xray/types';

const BOX: ChartBox = {
  width: 720,
  height: 240,
  padLeft: 28,
  padRight: 10,
  padTop: 12,
  padBottom: 26,
};

const GUIDES = [35, 50, 65];

interface ScoreTimelineProps {
  /** Monthly records, ascending. */
  series: readonly MonthRecord[];
  /** Slope in points per month used to draw the six-month trend. */
  trend6m: number;
}

/**
 * Draws the 24-month score history with the band guides, the detected
 * changepoint, the months flagged as stressed and the six-month Theil-Sen
 * trend projected over the same window.
 *
 * @param props - The series and the trend slope.
 * @returns An inline SVG chart, or an empty state when there is no history.
 */
export function ScoreTimeline({ series, trend6m }: ScoreTimelineProps) {
  if (series.length === 0) {
    return <p className="text-sm text-muted">Sin historial mensual.</p>;
  }
  const count = series.length;
  const last = series[count - 1];
  const stroke = scoreColor(last.score);
  const points = series.map((record, index) => ({
    x: xAt(index, count, BOX),
    y: yAt(record.score, 0, 100, BOX),
  }));
  const changepointIndex = series.findIndex(
    (record) => record.month === last.changepoint_month,
  );
  const trendStart = Math.max(count - 7, 0);
  const trendFrom = last.score - trend6m * (count - 1 - trendStart);
  const baseline = yAt(0, 0, 100, BOX);

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-56 w-full sm:h-64"
        role="img"
        aria-label={`Score mensual desde ${formatMonth(series[0].month)} hasta ${formatMonth(last.month)}`}
      >
        {GUIDES.map((guide) => (
          <g key={guide}>
            <line
              x1={BOX.padLeft}
              x2={BOX.width - BOX.padRight}
              y1={yAt(guide, 0, 100, BOX)}
              y2={yAt(guide, 0, 100, BOX)}
              stroke="var(--separator)"
              strokeWidth={1}
            />
            <text
              x={0}
              y={yAt(guide, 0, 100, BOX) + 3}
              className="fill-muted text-[10px]"
            >
              {guide}
            </text>
          </g>
        ))}

        <path
          d={areaPath(points, baseline)}
          fill={stroke}
          fillOpacity={0.12}
          stroke="none"
        />
        <path
          d={linePath(points)}
          fill="none"
          stroke={stroke}
          strokeWidth={2.2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {count - trendStart > 1 && (
          <line
            x1={xAt(trendStart, count, BOX)}
            y1={yAt(trendFrom, 0, 100, BOX)}
            x2={xAt(count - 1, count, BOX)}
            y2={yAt(last.score, 0, 100, BOX)}
            stroke="var(--foreground)"
            strokeWidth={1.4}
            strokeDasharray="5 4"
            opacity={0.55}
          />
        )}

        {changepointIndex >= 0 && (
          <g>
            <line
              x1={xAt(changepointIndex, count, BOX)}
              x2={xAt(changepointIndex, count, BOX)}
              y1={BOX.padTop}
              y2={baseline}
              stroke="var(--foreground)"
              strokeWidth={1.2}
              strokeDasharray="3 3"
              opacity={0.45}
            />
            <text
              x={xAt(changepointIndex, count, BOX) + 4}
              y={BOX.padTop + 9}
              className="fill-muted text-[10px]"
            >
              cambio de régimen
            </text>
          </g>
        )}

        {series.map((record, index) =>
          record.stress_now === 1 ? (
            <circle
              key={record.month}
              cx={xAt(index, count, BOX)}
              cy={yAt(record.score, 0, 100, BOX)}
              r={3.2}
              fill="var(--score-critical)"
            />
          ) : null,
        )}

        <circle
          cx={points[count - 1].x}
          cy={points[count - 1].y}
          r={3.6}
          fill={stroke}
        />

        {series.map((record, index) =>
          index % 3 === 0 || index === count - 1 ? (
            <text
              key={`label-${record.month}`}
              x={xAt(index, count, BOX)}
              y={BOX.height - 8}
              textAnchor="middle"
              className="fill-muted text-[10px]"
            >
              {formatMonthShort(record.month)}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
        <span>Línea discontinua: tendencia Theil-Sen de 6 meses.</span>
        <span>Vertical: changepoint PELT.</span>
        <span>Puntos rojos: meses con evento de estrés.</span>
      </figcaption>
    </figure>
  );
}
