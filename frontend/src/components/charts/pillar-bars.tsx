import { formatNumber, formatSigned } from '@/lib/xray/format';
import { scoreColor } from '@/lib/xray/score';
import { PILLAR_KEYS, type Pillars } from '@/lib/xray/types';

interface PillarBarsProps {
  /** Pillar scores of the latest month. */
  current: Pillars;
  /** Pillar scores six months earlier, when the history reaches back. */
  previous?: Pillars | null;
  /** Spanish pillar labels coming from the dataset. */
  labels: Record<string, string>;
}

/**
 * Compares the six pillars today against six months ago.
 *
 * The bar shows today's level; the hollow marker shows where the pillar was, so
 * the reader sees both the level and the movement without a second chart.
 *
 * @param props - Current pillars, past pillars and their Spanish labels.
 * @returns A list of labelled pillar bars.
 */
export function PillarBars({ current, previous, labels }: PillarBarsProps) {
  return (
    <ul className="flex flex-col gap-3">
      {PILLAR_KEYS.map((key) => {
        const value = current[key];
        const before = previous?.[key] ?? null;
        const delta = value !== null && before !== null ? value - before : null;
        return (
          <li
            key={key}
            className="grid grid-cols-[9rem_1fr_4.5rem] items-center gap-3 text-sm max-sm:grid-cols-[6.5rem_1fr_3.5rem]"
          >
            <span className="truncate text-muted">{labels[key] ?? key}</span>
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
              {before !== null && (
                <span
                  aria-hidden
                  className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-foreground/60"
                  style={{ left: `${Math.min(Math.max(before, 0), 100)}%` }}
                />
              )}
            </span>
            <span className="text-right tabular-nums">
              {formatNumber(value)}
              {delta !== null && (
                <span className="block text-xs text-muted">
                  {formatSigned(delta)}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
