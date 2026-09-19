import { yAt, type ChartBox } from '@/components/charts/geometry';
import { SCORE_GUIDES } from '@/lib/score';

interface ScoreGuidesProps {
  box: ChartBox;
  /** `false` drops the numbers when the chart is too small to carry them. */
  withLabels?: boolean;
}

/**
 * Draws the three band boundaries of the 0-100 score scale.
 *
 * The lines at 35, 50 and 65 are the only rules any score chart carries: they
 * are what turns a curve into a reading, because they say where the company
 * crosses from crítico to frágil, neutro and sólido.
 *
 * @param props - Chart box and whether the values are printed on the axis.
 * @returns The guide lines, to be placed under the data of an SVG chart.
 */
export function ScoreGuides({ box, withLabels = true }: ScoreGuidesProps) {
  return (
    <g aria-hidden="true">
      {SCORE_GUIDES.map((guide) => {
        const y = yAt(guide, 0, 100, box);
        return (
          <g key={guide}>
            <line
              x1={box.padLeft}
              x2={box.width - box.padRight}
              y1={y}
              y2={y}
              stroke="var(--separator)"
              strokeWidth={1}
            />
            {withLabels && (
              <text x={0} y={y + 3} className="fill-muted text-[10px]">
                {guide}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
