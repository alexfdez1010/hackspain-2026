import { SIGNAL_KINDS } from '@/lib/pulse/signals';
import type { PlacedTrajectoryPoint } from '@/lib/pulse/trajectory-layout';
import type { PulseSignal } from '@/lib/pulse/types';

/** Half-width of the marker triangle, in pixels. */
const HALF = 5;
/** Gap between the point and the marker. */
const GAP = 7;

interface TrajectoryMarkersProps {
  placed: readonly PlacedTrajectoryPoint[];
  /** Signal that opened at each axis index. */
  signals: ReadonlyMap<number, PulseSignal>;
}

/**
 * Flags the months where a signal opened: a triangle under the point for a
 * fall, over it for a rise, in the colour of the signal kind.
 *
 * @param props - Placed points and the signals keyed by index.
 * @returns The markers, one per signal that sits on a scored month.
 */
export function TrajectoryMarkers({ placed, signals }: TrajectoryMarkersProps) {
  return (
    <g>
      {placed.map((point) => {
        const signal = signals.get(point.index);
        if (!signal || point.y === null) return null;
        const down = signal.direction === 'down';
        const tip = down ? point.y + GAP : point.y - GAP;
        const base = down ? tip + HALF * 1.6 : tip - HALF * 1.6;
        const meta = SIGNAL_KINDS[signal.kind];
        return (
          <path
            key={`marker-${point.month}`}
            d={`M ${point.x} ${tip} L ${point.x - HALF} ${base} L ${point.x + HALF} ${base} Z`}
            fill={meta.color}
            data-signal={signal.kind}
          >
            <title>{signal.headline}</title>
          </path>
        );
      })}
    </g>
  );
}
