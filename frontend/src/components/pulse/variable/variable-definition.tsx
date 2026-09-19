import { Fragment } from 'react';

import { directionText } from '@/lib/method/variables';
import type { PulseVariableView } from '@/lib/pulse/variable-view';
import { formatNumber, formatPercent } from '@/lib/format';

interface PulseVariableDefinitionProps {
  view: PulseVariableView;
}

/**
 * Lists the specification rows of the variable.
 *
 * Direction, unit and origin come from the method documentation; a variable
 * the export publishes without documentation still shows what it is worth,
 * because the weight comes from the export itself.
 *
 * @param view - The variable of one company.
 * @returns The term and value pairs of the definition list.
 */
function definitionRows(view: PulseVariableView): [string, string][] {
  const { doc, pillar, shareOfPillar, variable } = view;
  return [
    ...(doc
      ? ([
          ['Dirección', directionText(doc.better)],
          ['Unidad', variable.unit],
          ['Origen', doc.source],
        ] as [string, string][])
      : []),
    ...(doc?.proxy
      ? ([['Proxy bancario', doc.proxy]] as [string, string][])
      : []),
    [
      'Peso',
      `${formatNumber(variable.weight)} de 100 puntos · ${formatPercent(shareOfPillar, 0)} del pilar ${pillar.label} (${formatNumber(pillar.weight)} pts)`,
    ],
    [
      'Número',
      `Variable ${formatNumber(variable.number)} de la especificación`,
    ],
  ];
}

/**
 * Explains what the variable measures and on which rules and data it rests.
 *
 * @param props - The variable of one company.
 * @returns The definition paragraph and its specification rows.
 */
export function PulseVariableDefinition({
  view,
}: PulseVariableDefinitionProps) {
  const { doc } = view;
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className={doc ? 'text-sm' : 'text-sm text-muted'}>
        {doc
          ? doc.measures
          : 'El método aún no documenta esta variable: el export la publica con su peso, pero sin definición ni origen.'}
      </p>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        {definitionRows(view).map(([term, value]) => (
          <Fragment key={term}>
            <dt className="text-muted">{term}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
