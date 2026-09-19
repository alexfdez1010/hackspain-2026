import { Fragment } from 'react';

import { directionText, methodVariableDoc } from '@/lib/method/variables';
import type { MethodWeightSegment } from '@/lib/method/weights';
import { formatNumber } from '@/lib/format';

interface MethodVariableDetailProps {
  /** Variable the treemap is pointing at. */
  segment: MethodWeightSegment;
  /** Points the whole score is worth, so the weight can be read as a share. */
  total: number;
}

/**
 * Explains the selected variable: what it measures, which way it reads, in
 * what unit and on which data it rests.
 *
 * @param props - Selected variable and the total points of the score.
 * @returns The detail panel of the treemap.
 */
export function MethodVariableDetail({
  segment,
  total,
}: MethodVariableDetailProps) {
  const doc = methodVariableDoc(segment.key);
  const rows: [string, string][] = [
    ['Dirección', doc ? directionText(doc.better) : '—'],
    ['Unidad del valor', segment.unit],
    ['Origen', doc?.source ?? '—'],
    ...(doc?.proxy
      ? ([['Proxy bancario', doc.proxy]] as [string, string][])
      : []),
  ];
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight">
          <span className="mr-2 font-mono text-sm text-muted">
            {formatNumber(segment.number)}
          </span>
          {segment.label}
        </h3>
        <p className="text-sm text-muted">
          <span className="tabular-nums">
            {formatNumber(segment.weight)} de {formatNumber(total)} puntos
          </span>{' '}
          · {segment.pillarLabel}
        </p>
      </div>
      {doc && <p className="text-sm">{doc.measures}</p>}
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([term, value]) => (
          <Fragment key={term}>
            <dt className="text-muted">{term}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
        <dt className="text-muted">Columna del export</dt>
        <dd className="font-mono text-xs">{segment.raw}</dd>
      </dl>
    </div>
  );
}
