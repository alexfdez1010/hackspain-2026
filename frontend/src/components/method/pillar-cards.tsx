import { MethodPillarArt } from '@/components/method/art-pillars';
import { Panel } from '@/components/ui/panel';
import { methodPillarDoc } from '@/lib/method/pillars';
import type { PulsePillarMeta, PulseVariableMeta } from '@/lib/pulse/types';
import { formatNumber } from '@/lib/format';

interface MethodPillarCardsProps {
  pillars: readonly PulsePillarMeta[];
  variables: readonly PulseVariableMeta[];
}

/**
 * One card per pillar: the question it answers, what it looks at told with an
 * everyday comparison, and the points it is worth.
 *
 * Heaviest pillar first, like the map of the 100 points, so both figures
 * read in the same order.
 *
 * @param props - Pillar and variable metadata from the export.
 * @returns The four cards, two per row on a desktop.
 */
export function MethodPillarCards({
  pillars,
  variables,
}: MethodPillarCardsProps) {
  const ordered = [...pillars].sort(
    (a, b) => b.weight - a.weight || a.label.localeCompare(b.label),
  );
  const total = pillars.reduce((sum, pillar) => sum + pillar.weight, 0);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {ordered.map((pillar) => {
        const doc = methodPillarDoc(pillar.key);
        const count = variables.filter(
          (variable) => variable.pillar === pillar.key,
        ).length;
        return (
          <Panel key={pillar.key} className="flex gap-5">
            {doc && <MethodPillarArt art={doc.art} />}
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-sm font-medium leading-[1.2] text-ink-secondary">
                {pillar.label} ·{' '}
                <span className="tabular-nums">
                  {formatNumber(pillar.weight)} de {formatNumber(total)} puntos
                </span>{' '}
                · {formatNumber(count)} {count === 1 ? 'variable' : 'variables'}
              </p>
              <h3 className="text-xl font-semibold leading-[1.3]">
                {doc?.question ?? pillar.label}
              </h3>
              {doc && (
                <>
                  <p className="text-[15px] leading-[1.55] text-ink-secondary">
                    {doc.plain}
                  </p>
                  <p className="text-[15px] leading-[1.55]">
                    <span className="font-medium">En la vida real: </span>
                    {doc.example}
                  </p>
                </>
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
