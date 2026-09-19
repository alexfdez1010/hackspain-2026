import {
  areaPath,
  linePath,
  xAt,
  yAt,
  type ChartBox,
} from '@/components/charts/geometry';
import { HAIRLINE } from '@/components/charts/tokens';
import type { PulsePillarPoint } from '@/lib/pulse/pillar-series';
import { SCORE_GUIDES, scoreColor } from '@/lib/score';

/** Drawing box in viewBox units; the SVG stretches to its container. */
const BOX: ChartBox = {
  width: 240,
  height: 76,
  padLeft: 1,
  padRight: 1,
  padTop: 8,
  padBottom: 8,
};

/** Lowest and highest score the sparkline shows, shared by the four pillars. */
const DOMAIN = { min: 20, max: 105 } as const;

interface PillarSparkProps {
  /** Observed months of one pillar, ascending. */
  points: readonly PulsePillarPoint[];
  /** Accessible description of what the line says. */
  label: string;
}

/**
 * Draws the observed history of one pillar with the guides at 35, 50 and 65.
 *
 * The four pillars share one vertical domain, so the shapes can be compared
 * side by side; months without a pillar score are skipped instead of being
 * drawn as a zero the pillar never scored.
 *
 * @param props - The monthly points and the accessible label.
 * @returns The sparkline, or nothing when no month carries a score.
 */
export function PillarSpark({ points, label }: PillarSparkProps) {
  const count = points.length;
  const drawn = points
    .map((point, index) => ({ value: point.value, x: xAt(index, count, BOX) }))
    .filter(
      (point): point is { value: number; x: number } => point.value !== null,
    )
    .map((point) => ({
      ...point,
      y: yAt(point.value, DOMAIN.min, DOMAIN.max, BOX),
    }));
  if (drawn.length === 0) return null;
  const color = scoreColor(drawn[drawn.length - 1].value);
  const baseline = BOX.height - BOX.padBottom;

  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      className="block h-[76px] w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      {SCORE_GUIDES.map((guide) => {
        const y = yAt(guide, DOMAIN.min, DOMAIN.max, BOX);
        return (
          <line
            key={guide}
            x1={0}
            x2={BOX.width}
            y1={y}
            y2={y}
            strokeWidth={1}
            stroke={HAIRLINE}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      <path d={areaPath(drawn, baseline)} fill={color} fillOpacity={0.13} />
      <path
        d={linePath(drawn)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {drawn.map((point, index) => (
        <circle
          key={point.x}
          cx={point.x}
          cy={point.y}
          r={index === drawn.length - 1 ? 3.5 : 2}
          fill={scoreColor(point.value)}
        />
      ))}
    </svg>
  );
}
