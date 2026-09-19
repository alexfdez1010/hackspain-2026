import { LeverList } from '@/components/advisor/lever-list';
import type { AdvisorImprovementPlan } from '@/lib/advisor/types';

interface ImprovementPlanPanelProps {
  plan: AdvisorImprovementPlan;
}

/**
 * Shows what the company would unlock by moving its pillars, and by how much
 * each move would cut the risk premium.
 *
 * It is the whole answer for a company with no offer today, so it names the
 * product, the score it needs and the variables that carry that score.
 *
 * @param props - Unlocks, levers and the sentences that narrate them.
 * @returns The improvement plan block.
 */
export function ImprovementPlanPanel({ plan }: ImprovementPlanPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      {plan.unlocks.length > 0 && (
        <ul className="flex max-w-3xl flex-col gap-2 text-sm">
          {plan.unlocks.map((unlock) => (
            <li key={unlock}>{unlock}</li>
          ))}
        </ul>
      )}
      <LeverList
        levers={plan.levers}
        story={plan.story}
        emptyText="Ningún pilar por debajo de 60: no hay palanca que cambie la decisión."
      />
    </div>
  );
}
