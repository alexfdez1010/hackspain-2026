import { ImpactBars, type ImpactItem } from '@/components/charts/impact-bars';
import { formatNumber } from '@/lib/xray/format';
import type { Company, Reason } from '@/lib/xray/types';

/**
 * Turns SHAP reasons into diverging-bar items, keeping the raw feature value as
 * the second line so the driver can be checked against the books.
 *
 * @param reasons - Reasons attached to the company or month.
 * @param pillarLabels - Spanish pillar labels.
 * @returns Items ready for {@link ImpactBars}, strongest contribution first.
 */
export function toImpactItems(
  reasons: readonly Reason[],
  pillarLabels: Record<string, string>,
): ImpactItem[] {
  return [...reasons]
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .map((reason) => ({
      key: reason.feature,
      label: reason.label,
      value: reason.impact,
      detail: `${pillarLabels[reason.pillar] ?? reason.pillar} · valor ${formatNumber(reason.value, 2)}`,
    }));
}

interface WhyPanelProps {
  company: Company;
  pillarLabels: Record<string, string>;
}

/**
 * Explains the score: which drivers push it up, which pull it down, and — when
 * the model published one — what moved between the last two months.
 *
 * @param props - The company and the Spanish pillar labels.
 * @returns The drivers, the waterfall and the narrative.
 */
export function WhyPanel({ company, pillarLabels }: WhyPanelProps) {
  const items = toImpactItems(company.reasons, pillarLabels);
  const explanation = company.explanation;

  return (
    <div className="flex flex-col gap-6">
      <ImpactBars
        items={items}
        emptyText="El modelo no ha publicado factores para este mes."
      />

      {explanation && explanation.waterfall.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium text-muted">
            Qué ha movido el score respecto al mes anterior
          </h3>
          <ImpactBars
            items={explanation.waterfall.map((step) => ({
              key: step.feature,
              label: step.label,
              value: step.delta_points,
              detail: `${formatNumber(step.value_before, 2)} → ${formatNumber(step.value_after, 2)}`,
            }))}
            emptyText="Sin descomposición mes a mes."
          />
        </div>
      )}

      {explanation?.narrative_es && (
        <p className="max-w-3xl leading-relaxed">{explanation.narrative_es}</p>
      )}
      {explanation?.regime_text_es && (
        <p className="max-w-3xl text-muted">{explanation.regime_text_es}</p>
      )}
    </div>
  );
}
