import { LeverList } from '@/components/advisor/lever-list';
import type { AdvisorImprovementPlan } from '@/lib/advisor/types';

interface ImprovementPlanPanelProps {
  plan: AdvisorImprovementPlan;
}

/**
 * Shows what the company would unlock by moving its pillars, and by how much
 * each move would cut the risk premium.
 *
 * The unlocks come first, as the goals; the levers under them show the moves
 * on the band scale, so the sentences that narrate each lever are not
 * repeated here.
 *
 * @param props - Unlocks, levers and the sentences that narrate them.
 * @returns The improvement plan block.
 */
export function ImprovementPlanPanel({ plan }: ImprovementPlanPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      {plan.unlocks.length > 0 && (
        <ul className="flex max-w-3xl flex-col gap-2">
          {plan.unlocks.map((unlock) => (
            <li key={unlock} className="flex gap-3 text-sm">
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-accent"
              />
              <span>{unlock}</span>
            </li>
          ))}
        </ul>
      )}
      <LeverList
        levers={plan.levers}
        emptyText="Ningún pilar por debajo de 60: no hay palanca que cambie la decisión."
      />
    </div>
  );
}
