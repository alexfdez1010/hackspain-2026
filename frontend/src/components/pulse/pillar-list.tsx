import { bandTint } from '@/lib/pulse/band';
import { pillarOrderIndex } from '@/lib/pulse/mosaic';
import { UNKNOWN_TEXT } from '@/lib/pulse/format';
import type { PulsePillarMeta, PulsePillars } from '@/lib/pulse/types';
import { formatNumber } from '@/lib/format';
import { scoreColor } from '@/lib/score';

interface PulsePillarListProps {
  /** Pillar metadata with the points each one owns. */
  pillars: readonly PulsePillarMeta[];
  /** Pillar scores of the month being viewed. */
  scores: PulsePillars;
}

/**
 * The four pillar scores of one month as bars on the same 0-100 scale.
 *
 * The bar is the score and the order is the model's, from the money coming in
 * to the money going out, so two months can be compared row by row.
 *
 * Each row is a card washed with the colour of its own band, and the track of
 * the bar is a deeper wash of the same hue: the tinted surface is what groups
 * the label, the bar and the figure, so no hairline is drawn between rows and
 * none boxes a card. A pillar with no score keeps the plain secondary surface,
 * because an unmeasured pillar has no severity to colour.
 *
 * @param props - Pillar metadata and the scores of the month.
 * @returns The pillar rows.
 */
export function PulsePillarList({ pillars, scores }: PulsePillarListProps) {
  const ordered = [...pillars].sort(
    (a, b) => pillarOrderIndex(a.key) - pillarOrderIndex(b.key),
  );
  return (
    <ul>
      {ordered.map((pillar) => {
        const value = scores[pillar.key] ?? null;
        return (
          <li
            key={pillar.key}
            className={`mb-2 grid grid-cols-[minmax(0,1fr)_56px] items-center gap-4 rounded-lg px-4 py-3.5 last:mb-0 ${
              value === null ? 'bg-surface-secondary' : ''
            }`}
            style={{ background: bandTint(value, 10) }}
          >
            <span className="min-w-0">
              <b className="block text-[15px] font-medium">{pillar.label}</b>
              <span
                className={`mt-2 block h-1.5 rounded ${value === null ? 'bg-surface-secondary' : ''}`}
                style={{ background: bandTint(value, 20) }}
              >
                {value !== null && (
                  <span
                    className="block h-full rounded"
                    style={{
                      width: `${Math.min(Math.max(value, 0), 100)}%`,
                      background: scoreColor(value),
                    }}
                  />
                )}
              </span>
            </span>
            <b className="text-right text-xl font-semibold leading-snug tabular-nums">
              {value === null ? UNKNOWN_TEXT : formatNumber(value, 1)}
            </b>
          </li>
        );
      })}
    </ul>
  );
}
