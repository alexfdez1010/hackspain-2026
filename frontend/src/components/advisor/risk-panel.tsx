import { ImpactBars, type ImpactItem } from '@/components/charts/impact-bars';
import type { AdvisorRisk } from '@/lib/advisor/types';
import { formatRiskDriverValue } from '@/lib/advisor/view';

interface RiskPanelProps {
  risk: AdvisorRisk;
}

/**
 * Decomposes the probability of stress the risk premium is charged for: one
 * diverging bar per driver of the logistic model.
 *
 * @param props - Probability, portfolio base rate and drivers.
 * @returns The risk block.
 */
export function RiskPanel({ risk }: RiskPanelProps) {
  const items: ImpactItem[] = risk.contributions.map((contribution) => ({
    key: contribution.feature,
    label: contribution.label,
    value: contribution.logit ?? 0,
    detail: formatRiskDriverValue(contribution.feature, contribution.value),
  }));
  return (
    <div className="flex flex-col gap-3">
      <ImpactBars
        items={items}
        emptyText="El modelo no publicó los aportes de esta empresa."
        digits={2}
      />
      <p className="max-w-3xl text-sm text-muted">
        Un aporte positivo sube la probabilidad de tensión a seis meses; uno
        negativo la baja. La suma de los aportes es lo que el precio traduce en
        prima de riesgo.
      </p>
    </div>
  );
}
