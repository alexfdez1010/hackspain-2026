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
 * reader following a weak pillar wants its other variables first. Each one is
 * a category chip and the open one is the only filled chip on the page, so
 * «where am I» is answered without an underline or a colour.
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
      className="flex flex-wrap gap-x-8 gap-y-5"
    >
      {pillars.map((pillar) => {
        const items = ordered.filter(
          (variable) => variable.pillar === pillar.key,
        );
        if (items.length === 0) return null;
        return (
          <div key={pillar.key} className="flex min-w-0 flex-col gap-2">
            <span className="text-[13px] font-semibold uppercase leading-[1.2] tracking-[0.06em] text-ink-muted">
              {pillar.label}
            </span>
            <ul className="flex flex-wrap gap-1.5">
              {items.map((variable) => {
                const current = variable.key === currentKey;
                return (
                  <li key={variable.key}>
                    <Link
                      href={companyVariableRoute(companyId, variable.key)}
                      aria-current={current ? 'page' : undefined}
                      className={`inline-block rounded-md px-2.5 py-1.5 text-xs font-medium leading-[1.2] transition-colors ${
                        current
                          ? 'bg-ink text-page'
                          : 'bg-surface-secondary text-ink-secondary hover:text-ink'
                      }`}
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
