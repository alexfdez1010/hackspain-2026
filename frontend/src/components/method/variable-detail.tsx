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
 * Explains the selected variable: the question it answers in plain words,
 * what it measures, which way it reads, in what unit and on which data it
 * rests.
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
    <div className="flex max-w-[720px] flex-col gap-3" aria-live="polite">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold leading-[1.3]">
          <span className="mr-2 text-[15px] font-medium tabular-nums text-ink-muted">
            {formatNumber(segment.number)}
          </span>
          {segment.label}
        </h3>
        <p className="text-sm font-medium leading-[1.2] text-ink-secondary">
          <span className="tabular-nums">
            {formatNumber(segment.weight)} de {formatNumber(total)} puntos
          </span>{' '}
          · {segment.pillarLabel}
        </p>
      </div>
      {doc && (
        <>
          <p className="text-[17px] leading-[1.6]">{doc.plain}</p>
          <p className="text-[15px] leading-[1.55] text-ink-secondary">
            <span className="font-medium text-ink">En detalle: </span>
            {doc.measures}
          </p>
        </>
      )}
      <dl>
        {rows.map(([term, value]) => (
          <div
            key={term}
            className="grid grid-cols-[10rem_minmax(0,1fr)] items-baseline gap-5 border-b border-hairline py-2.5 text-[15px] leading-[1.55] last:border-0 last:pb-0"
          >
            <dt className="text-ink-secondary">{term}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
