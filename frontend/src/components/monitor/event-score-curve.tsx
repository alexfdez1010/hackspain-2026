import {
  linePath,
  niceDomain,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import { formatNumber } from '@/lib/xray/format';
import type { ScorePoint } from '@/lib/xray/anticipation';

const BOX: ChartBox = {
  width: 640,
  height: 180,
  padLeft: 26,
  padRight: 8,
  padTop: 10,
  padBottom: 26,
};

interface EventScoreCurveProps {
  /** Mean score by months to the event, ascending by offset. */
  curve: readonly ScorePoint[];
  /** Mean score of the whole portfolio, drawn as the reference level. */
  populationMean: number | null;
}

/**
 * Draws the mean score around a stress episode, with month 0 as the event.
 *
 * It is the visual proof of anticipation: the curve sits below the portfolio
 * mean months before the episode and collapses at month 0.
 *
 * @param props - The curve and the portfolio mean.
 * @returns An inline SVG chart with the event marked.
 */
export function EventScoreCurve({
  curve,
  populationMean,
}: EventScoreCurveProps) {
  const values = curve
    .map((point) => point.meanScore)
    .filter((value): value is number => value !== null);
  if (values.length < 2) {
    return <p className="text-sm text-muted">Sin curva de evento.</p>;
  }
  const domain = niceDomain(
    populationMean === null ? values : [...values, populationMean],
    { margin: 0.2, min: 0, max: 100 },
  );
  const points = curve.map((point, index) => ({
    x: xAt(index, curve.length, BOX),
    y: yAt(point.meanScore ?? domain.min, domain.min, domain.max, BOX),
  }));
  const zeroIndex = curve.findIndex((point) => point.offset === 0);

  return (
    <figure className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-muted">
        Score medio alrededor del episodio de tensión
      </h3>
      <svg
        viewBox={`0 0 ${BOX.width} ${BOX.height}`}
        className="h-44 w-full max-w-3xl"
        role="img"
        aria-label="Score medio por meses hasta el evento de tensión"
      >
        {populationMean !== null && (
          <g>
            <line
              x1={BOX.padLeft}
              x2={BOX.width - BOX.padRight}
              y1={yAt(populationMean, domain.min, domain.max, BOX)}
              y2={yAt(populationMean, domain.min, domain.max, BOX)}
              stroke="var(--separator)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <text
              x={BOX.width - BOX.padRight}
              y={yAt(populationMean, domain.min, domain.max, BOX) - 4}
              textAnchor="end"
              className="fill-muted text-[10px]"
            >
              media de la cartera {formatNumber(populationMean, 1)}
            </text>
          </g>
        )}

        {zeroIndex >= 0 && (
          <line
            x1={xAt(zeroIndex, curve.length, BOX)}
            x2={xAt(zeroIndex, curve.length, BOX)}
            y1={BOX.padTop}
            y2={BOX.height - BOX.padBottom}
            stroke="var(--foreground)"
            strokeWidth={1.2}
            opacity={0.45}
          />
        )}

        <path
          d={linePath(points)}
          fill="none"
          stroke="var(--score-critical)"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />

        {curve.map((point, index) =>
          point.offset % 3 === 0 ? (
            <text
              key={point.offset}
              x={xAt(index, curve.length, BOX)}
              y={BOX.height - 8}
              textAnchor="middle"
              className="fill-muted text-[10px]"
            >
              {point.offset > 0 ? `+${point.offset}` : point.offset}
            </text>
          ) : null,
        )}
      </svg>
      <figcaption className="text-xs text-muted">
        Mes 0 es el primer mes del episodio. Los valores negativos son los meses
        anteriores.
      </figcaption>
    </figure>
  );
}
