import { Chip } from '@heroui/react';

import { PillarShift } from '@/components/advisor/pillar-shift';
import { ScoreBadge } from '@/components/ui/score-badge';
import { formatSignedBps } from '@/lib/advisor/format';
import type { AdvisorLever } from '@/lib/advisor/types';
import { sortLevers, topLeverPillar } from '@/lib/advisor/view';
import { formatNumber, formatPercent } from '@/lib/format';

interface LeverListProps {
  levers: readonly AdvisorLever[];
  /** Sentences the backend wrote for these levers. */
  story?: readonly string[];
  /** Shown when the company has no lever left to pull. */
  emptyText: string;
}

/**
 * Lays the counterfactuals out as one block per pillar: the move on the band
 * scale, the premium it saves, the probability of stress it leaves and the
 * variables that carry the pillar.
 *
 * Levers are ordered by saving and the largest one is tagged, because it is
 * the only one worth working on first.
 *
 * @param props - Levers, the sentences that narrate them and the empty text.
 * @returns The lever blocks.
 */
export function LeverList({ levers, story, emptyText }: LeverListProps) {
  if (levers.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  const ordered = sortLevers(levers);
  const top = topLeverPillar(levers);

  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-x-10 gap-y-8 lg:grid-cols-3">
        {ordered.map((lever) => {
          const best = lever.pillar === top;
          return (
            <li key={lever.pillar} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold">{lever.label}</h4>
                {best && (
                  <Chip size="sm" variant="soft" color="accent">
                    <Chip.Label>mayor ahorro</Chip.Label>
                  </Chip>
                )}
              </div>
              <PillarShift
                current={lever.current}
                target={lever.target}
                label={lever.label}
              />
              <dl className="grid grid-cols-2 gap-x-4">
                <div className="flex flex-col">
                  <dd
                    className={`text-xl tabular-nums tracking-tight ${best ? 'font-semibold' : 'font-medium'}`}
                  >
                    {formatSignedBps(-(lever.premiumSavingBps ?? 0))}
                  </dd>
                  <dt className="text-xs text-muted">de prima de riesgo</dt>
                </div>
                <div className="flex flex-col">
                  <dd className="text-xl font-medium tabular-nums tracking-tight">
                    {formatPercent(lever.pStressNow, 0)} →{' '}
                    {formatPercent(lever.pStressThen, 0)}
                  </dd>
                  <dt className="text-xs text-muted">tensión a 6 meses</dt>
                </div>
              </dl>
              <ul className="flex flex-col gap-1.5 text-sm">
                {lever.variables.map((variable) => (
                  <li
                    key={variable.key}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <span className="min-w-0">{variable.label}</span>
                    <span className="shrink-0 text-xs text-muted tabular-nums">
                      <ScoreBadge score={variable.score} />
                      /100 · {formatNumber(variable.weight)} pts del PULSE
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      {story && story.length > 0 && (
        <ul className="flex max-w-3xl flex-col gap-2 text-sm text-muted">
          {story.map((sentence) => (
            <li key={sentence}>{sentence}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
