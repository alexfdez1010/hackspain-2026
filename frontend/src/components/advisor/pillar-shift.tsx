import { formatNumber } from '@/lib/format';
import { SCORE_BANDS, scoreBand } from '@/lib/score';

interface PillarShiftProps {
  /** Score of the pillar today. */
  current: number | null;
  /** Score the lever asks the pillar to reach. */
  target: number | null;
  /** Accessible name of the pillar. */
  label: string;
}

/**
 * Draws the move a lever asks for on the 0-100 band scale: the four bands as
 * a faint track, the pillar today as a filled marker, the target as a hollow
 * one and the stretch between them highlighted.
 *
 * The scale is the same one every score chart uses, so «de 34 a 60» reads as
 * «de crítico a neutro» without any extra words.
 *
 * @param props - Current score, target score and the pillar name.
 * @returns The track with both markers and their figures.
 */
export function PillarShift({ current, target, label }: PillarShiftProps) {
  const from = current ?? 0;
  const to = target ?? from;
  const left = Math.min(from, to);
  const width = Math.abs(to - from);
  const now = scoreBand(current);
  const then = scoreBand(target);
  return (
    <figure className="flex flex-col gap-1.5">
      <div
        role="img"
        aria-label={`${label}: de ${formatNumber(current, 0)}, ${now.label}, a ${formatNumber(target, 0)}, ${then.label}`}
        className="relative h-3 w-full"
      >
        <div className="absolute inset-y-1 flex w-full overflow-hidden rounded-full">
          {SCORE_BANDS.map((band) => {
            const min = Number.isFinite(band.min) ? band.min : 0;
            const max = Number.isFinite(band.max) ? band.max : 100;
            return (
              <span
                key={band.key}
                className="h-full opacity-25"
                style={{ width: `${max - min}%`, background: band.color }}
              />
            );
          })}
        </div>
        <span
          className="absolute inset-y-1 rounded-full"
          style={{
            left: `${left}%`,
            width: `${width}%`,
            background: then.color,
            opacity: 0.7,
          }}
        />
        <span
          className="absolute top-0 size-3 -translate-x-1/2 rounded-full ring-2 ring-background"
          style={{ left: `${from}%`, background: now.color }}
        />
        <span
          className="absolute top-0 size-3 -translate-x-1/2 rounded-full border-2 bg-background"
          style={{ left: `${to}%`, borderColor: then.color }}
        />
      </div>
      <figcaption className="flex justify-between text-xs tabular-nums">
        <span>
          <span className="font-medium" style={{ color: now.color }}>
            {formatNumber(current, 0)}
          </span>{' '}
          <span className="text-muted">hoy · {now.label}</span>
        </span>
        <span className="text-right">
          <span className="font-medium" style={{ color: then.color }}>
            {formatNumber(target, 0)}
          </span>{' '}
          <span className="text-muted">objetivo · {then.label}</span>
        </span>
      </figcaption>
    </figure>
  );
}
