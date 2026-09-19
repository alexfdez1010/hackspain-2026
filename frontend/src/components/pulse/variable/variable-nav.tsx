import Link from 'next/link';

import type { PulsePillarMeta, PulseVariableMeta } from '@/lib/pulse/types';
import { orderedVariables } from '@/lib/pulse/variable-view';
import { companyVariableRoute } from '@/lib/routes';

interface PulseVariableNavProps {
  /** Company every link stays inside. */
  companyId: string;
  /** Variable metadata from the export. */
  variables: readonly PulseVariableMeta[];
  /** Key of the variable whose page is open. */
  currentKey: string;
  /** Pillar metadata; the groups follow the published order. */
  pillars: readonly PulsePillarMeta[];
}

/**
 * Moves between the eleven variables of the same company without going back
 * to the score.
 *
 * The links are grouped by pillar because that is how the score is built: a
 * reader following a weak pillar wants its other variables first. The current
 * one keeps the same underline the section navigation uses, so «where am I»
 * reads the same everywhere.
 *
 * @param props - Company, variable metadata, current key and pillars.
 * @returns The grouped list of variable links.
 */
export function PulseVariableNav({
  companyId,
  variables,
  currentKey,
  pillars,
}: PulseVariableNavProps) {
  const ordered = orderedVariables(variables);
  return (
    <nav
      aria-label="Otras variables"
      className="flex flex-wrap gap-x-10 gap-y-5 text-sm"
    >
      {pillars.map((pillar) => {
        const items = ordered.filter(
          (variable) => variable.pillar === pillar.key,
        );
        if (items.length === 0) return null;
        return (
          <div key={pillar.key} className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-muted">{pillar.label}</span>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {items.map((variable) => {
                const current = variable.key === currentKey;
                return (
                  <li key={variable.key}>
                    <Link
                      href={companyVariableRoute(companyId, variable.key)}
                      aria-current={current ? 'page' : undefined}
                      className={
                        current
                          ? 'inline-block py-1 underline decoration-2 underline-offset-8 sm:py-0'
                          : 'inline-block py-1 text-muted transition-colors hover:text-foreground sm:py-0'
                      }
                    >
                      {variable.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
