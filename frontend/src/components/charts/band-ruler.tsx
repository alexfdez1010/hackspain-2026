import { BAND_SCALE, DRAWABLE_BANDS } from '@/lib/pulse/band';
import { formatNumber } from '@/lib/format';
import { scoreBand } from '@/lib/score';

/** Drawing size in viewBox units; the SVG scales to its container. */
const BOX = { width: 600, height: 84 } as const;
/** Vertical placement of the 0-100 bar. */
const BAR = { y: 34, height: 16 } as const;

interface BandRulerProps {
  /** Score of the last close. */
  value: number | null;
  /** Score of the month before it; `null` drops the hollow marker. */
  previous?: number | null;
}

/**
 * Places a score on the 0-100 scale, over the four bands and next to where the
 * company came from.
 *
 * The bar is the scale itself, tinted band by band, so the reader sees the
 * distance to the next boundary instead of a bare number: a 46 two points under
 * 48 reads very differently from a 46 sitting in the middle of its band.
 *
 * @param props - Score of the month and of the month before.
 * @returns The ruler, or nothing when there is no score to place.
 */
export function BandRuler({ value, previous = null }: BandRulerProps) {
  if (value === null) return null;
  const x = (score: number) => (BOX.width * score) / BAND_SCALE.max;
  const color = scoreBand(value).color;
  return (
    <svg
      viewBox={`0 0 ${BOX.width} ${BOX.height}`}
      width="100%"
      className="block h-auto w-full"
      role="img"
      aria-label={`PULSE ${formatNumber(value, 1)} sobre la escala de bandas`}
    >
      {DRAWABLE_BANDS.map(({ band, min, max }) => (
        <g key={band.key}>
          <rect
            x={x(min)}
            y={BAR.y}
            width={x(max) - x(min)}
            height={BAR.height}
            rx={4}
            fill={band.color}
            fillOpacity={0.18}
          />
          <text
            x={(x(min) + x(max)) / 2}
            y={BAR.y + BAR.height + 15}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill={band.color}
          >
            {band.name}
          </text>
          {min > BAND_SCALE.min && (
            <text
              x={x(min)}
              y={BAR.y - 6}
              textAnchor="middle"
              fontSize={10.5}
              className="fill-muted"
            >
              {min}
            </text>
          )}
        </g>
      ))}
      {previous !== null && (
        <g>
          <line
            x1={x(previous)}
            x2={x(previous)}
            y1={BAR.y - 2}
            y2={BAR.y + BAR.height + 2}
            strokeWidth={1.5}
            strokeDasharray="2 2"
            className="stroke-muted"
          />
          <text
            x={x(previous)}
            y={11}
            textAnchor="middle"
            fontSize={10.5}
            className="fill-muted"
          >
            mes anterior {formatNumber(previous, 1)}
          </text>
        </g>
      )}
      <rect
        x={x(value) - 1.6}
        y={BAR.y - 5}
        width={3.2}
        height={BAR.height + 10}
        rx={1.6}
        fill={color}
      />
    </svg>
  );
}
