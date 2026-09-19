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
 * Shows the four pillar scores next to the points they own of the 100.
 *
 * The weight is part of the reading: a 30 in a pillar worth 36 points moves the
 * score far more than the same 30 in a pillar worth 12.
 *
 * @param props - Pillar metadata and the scores of the month.
 * @returns A list of pillar bars ordered by weight.
 */
export function PulsePillarList({ pillars, scores }: PulsePillarListProps) {
  const ordered = [...pillars].sort((a, b) => b.weight - a.weight);
  return (
    <ul className="flex flex-col gap-3">
      {ordered.map((pillar) => {
        const value = scores[pillar.key] ?? null;
        return (
          <li
            key={pillar.key}
            className="grid grid-cols-[11rem_1fr_4rem] items-center gap-3 text-sm max-sm:grid-cols-[8rem_1fr_3.5rem]"
          >
            <span className="min-w-0">
              <span className="block truncate">{pillar.label}</span>
              <span className="block text-xs text-muted">
                {formatNumber(pillar.weight)} de 100 puntos
              </span>
            </span>
            <span className="relative block h-2 rounded-full bg-surface-secondary">
              {value !== null && (
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.min(Math.max(value, 0), 100)}%`,
                    backgroundColor: scoreColor(value),
                  }}
                />
              )}
            </span>
            <span className="text-right tabular-nums">
              {value === null ? UNKNOWN_TEXT : formatNumber(value, 1)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
