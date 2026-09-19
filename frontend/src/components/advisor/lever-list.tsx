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
 * Lists the counterfactuals: what each pillar would have to reach, what the
 * probability of stress would become and how much of the risk premium that
 * would save.
 *
 * Levers are ordered by saving and the largest one is named, because it is the
 * only one worth working on first.
 *
 * @param props - Levers, the sentences that narrate them and the empty text.
 * @returns The lever list.
 */
export function LeverList({ levers, story, emptyText }: LeverListProps) {
  if (levers.length === 0) {
    return <p className="text-sm text-muted">{emptyText}</p>;
  }
  const ordered = sortLevers(levers);
  const top = topLeverPillar(levers);

  return (
    <div className="flex flex-col gap-5">
      <ul className="flex flex-col gap-5">
        {ordered.map((lever) => (
          <li key={lever.pillar} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="text-sm font-medium">
                {lever.label}: <ScoreBadge score={lever.current} /> →{' '}
                <ScoreBadge score={lever.target} />
              </p>
              <p className="text-sm tabular-nums">
                <span
                  className={
                    lever.pillar === top ? 'font-semibold' : 'font-medium'
                  }
                >
                  {formatSignedBps(-(lever.premiumSavingBps ?? 0))}
                </span>{' '}
                <span className="text-xs text-muted">
                  de prima{lever.pillar === top ? ' · mayor ahorro' : ''}
                </span>
              </p>
            </div>
            <p className="text-xs text-muted tabular-nums">
              Probabilidad de tensión a 6 meses{' '}
              {formatPercent(lever.pStressNow, 0)} →{' '}
              {formatPercent(lever.pStressThen, 0)}
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {lever.variables.map((variable) => (
                <li key={variable.key} className="text-xs text-muted">
                  {variable.label}{' '}
                  <span className="tabular-nums">
                    {formatNumber(variable.score, 0)}/100
                  </span>{' '}
                  <span className="tabular-nums">
                    ({formatNumber(variable.weight)} pts del PULSE)
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
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
