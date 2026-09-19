import type { PillarFeatures } from '@/lib/xray/method';

interface FeatureTableProps {
  groups: readonly PillarFeatures[];
  /** Spanish pillar labels coming from the dataset. */
  labels: Record<string, string>;
}

/**
 * Lists the model variables grouped by the pillar they feed.
 *
 * @param props - The grouped features and the pillar labels.
 * @returns One column per pillar with its variables.
 */
export function FeatureTable({ groups, labels }: FeatureTableProps) {
  if (groups.length === 0) {
    return <p className="text-sm text-muted">Sin variables publicadas.</p>;
  }
  return (
    <div className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => (
        <div key={group.pillar} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">
            {labels[group.pillar] ?? 'Otras variables'}
          </h3>
          <ul className="flex flex-col gap-1 text-sm text-muted">
            {group.features.map((feature) => (
              <li key={feature.feature}>{feature.label}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
