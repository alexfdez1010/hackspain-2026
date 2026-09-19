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
 * States the rules and the data the variable rests on, as the hairline rows
 * of a specification card.
 *
 * What it measures is not repeated here: the page opens with that sentence,
 * so this block only carries what the heading and the lead cannot.
 *
 * @param props - The variable of one company.
 * @returns The specification rows, or the note of an undocumented variable.
 */
export function PulseVariableDefinition({
  view,
}: PulseVariableDefinitionProps) {
  const { doc } = view;
  return (
    <div className="flex max-w-[720px] flex-col gap-4">
      {!doc && (
        <p className="text-[15px] leading-[1.55] text-ink-secondary">
          El método aún no documenta esta variable: el export la publica con su
          peso, pero sin definición ni origen.
        </p>
      )}
      <dl>
        {definitionRows(view).map(([term, value]) => (
          <div
            key={term}
            className="grid grid-cols-[10rem_minmax(0,1fr)] items-baseline gap-5 border-b border-hairline py-3 text-[15px] leading-[1.55] first:pt-0 last:border-0 last:pb-0"
          >
            <dt className="text-ink-secondary">{term}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
