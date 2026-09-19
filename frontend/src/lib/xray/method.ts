import type { Anticipation } from '@/lib/xray/anticipation';
import { PILLAR_KEYS, type Company, type PillarKey } from '@/lib/xray/types';

/** Features of one pillar, with the Spanish label published by the service. */
export interface PillarFeatures {
  pillar: PillarKey | 'otros';
  features: { feature: string; label: string }[];
}

/**
 * Recovers which pillar each feature belongs to.
 *
 * `feature_labels` is a flat map, so the pillar is read from the reasons the
 * model attaches to the companies.
 *
 * @param companies - Companies whose reasons carry feature and pillar.
 * @returns A feature to pillar map.
 */
export function featurePillarMap(
  companies: readonly Company[],
): Record<string, string> {
  const pillars: Record<string, string> = {};
  for (const company of companies) {
    for (const reason of company.reasons) {
      if (reason.pillar !== '' && pillars[reason.feature] === undefined) {
        pillars[reason.feature] = reason.pillar;
      }
    }
  }
  return pillars;
}

/**
 * Groups the model features by pillar, in the canonical pillar order.
 *
 * Features whose pillar is unknown are grouped under `otros` instead of being
 * dropped, so a regenerated dataset never hides variables.
 *
 * @param featureLabels - Feature to Spanish label map.
 * @param featurePillars - Feature to pillar map.
 * @returns One group per pillar that has at least one feature.
 */
export function groupFeaturesByPillar(
  featureLabels: Record<string, string>,
  featurePillars: Record<string, string>,
): PillarFeatures[] {
  const groups = new Map<string, { feature: string; label: string }[]>();
  for (const [feature, label] of Object.entries(featureLabels)) {
    const pillar = featurePillars[feature] ?? 'otros';
    const bucket = groups.get(pillar) ?? [];
    bucket.push({ feature, label });
    groups.set(pillar, bucket);
  }

  const ordered: PillarFeatures[] = [];
  for (const pillar of [...PILLAR_KEYS, 'otros' as const]) {
    const features = groups.get(pillar);
    if (features && features.length > 0) ordered.push({ pillar, features });
  }
  return ordered;
}

/** A figure rendered in the Método results grid. */
export interface MethodMetric {
  key: string;
  label: string;
  value: string;
  hint?: string;
}

/**
 * Builds the evaluation figures from the anticipation block.
 *
 * Only measures the service actually published are returned, so the page never
 * shows a number the dataset does not back.
 *
 * @param anticipation - Normalised anticipation evidence.
 * @returns The figures to display, possibly empty.
 */
export function metricsFromAnticipation(
  anticipation: Anticipation,
): MethodMetric[] {
  const metrics: MethodMetric[] = anticipation.aurocOof.map((point) => ({
    key: `auroc-${point.horizon}`,
    label:
      point.horizon.replace(/\D/g, '') === '1'
        ? 'AUROC a 1 mes'
        : `AUROC a ${point.horizon.replace(/\D/g, '')} meses`,
    value: point.auroc.toLocaleString('es-ES', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }),
    hint: 'Fuera de muestra, validación por grupos',
  }));
  const lead = anticipation.leadTime;
  if (lead?.medianLeadMonths !== null && lead?.medianLeadMonths !== undefined) {
    metrics.push({
      key: 'lead',
      label: 'Adelanto mediano',
      value: `${lead.medianLeadMonths.toLocaleString('es-ES')} meses`,
      hint: `${lead.nEvents?.toLocaleString('es-ES') ?? '—'} episodios evaluados`,
    });
  }
  return metrics;
}

/** Headline numbers used when the service publishes no evaluation evidence. */
export const FALLBACK_METRICS: MethodMetric[] = [
  {
    key: 'auroc',
    label: 'AUROC, validación por grupos',
    value: '0,84',
    hint: 'Cifra del modelo entrenado',
  },
  { key: 'horizon', label: 'Horizonte del objetivo', value: '6 meses' },
  { key: 'months', label: 'Meses de historia', value: '24' },
];
