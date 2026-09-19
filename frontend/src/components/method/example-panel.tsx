import Link from 'next/link';

import { MethodExampleTable } from '@/components/method/example-table';
import { companyName } from '@/lib/company/names';
import type { MethodExample } from '@/lib/method/example';
import { formatConfidence } from '@/lib/pulse/format';
import { companyRoutes } from '@/lib/routes';
import { formatMonth, formatNumber } from '@/lib/format';

interface MethodExamplePanelProps {
  example: MethodExample;
}

/**
 * Reads one real month end to end: the contributions of the variables with
 * evidence and their sum, which is the PULSE of the month.
 *
 * Working the example on published figures is the point: the reader can repeat
 * the addition and land on the same score the company page shows.
 *
 * @param props - The worked example of the demo company.
 * @returns The table of contributions and the two sentences that close it.
 */
export function MethodExamplePanel({ example }: MethodExamplePanelProps) {
  const { rows, pulse, contributionSum, unknownLabels } = example;
  return (
    <div className="flex flex-col gap-5">
      <MethodExampleTable rows={rows} />
      <div className="flex max-w-[720px] flex-col gap-3 text-[15px] leading-[1.55]">
        <p>
          Los {formatNumber(rows.length)} aportes suman{' '}
          <span className="font-medium tabular-nums">
            {formatNumber(contributionSum, 2)}
          </span>
          , que es el PULSE del mes:{' '}
          <span className="font-medium tabular-nums">
            {formatNumber(pulse, 1)}
          </span>
          . No hay nada más que sumar.
        </p>
        {unknownLabels.length > 0 && (
          <p className="text-ink-secondary">
            Sin datos en {formatMonth(example.month)}:{' '}
            {unknownLabels.join(', ')} — {formatNumber(example.unknownWeight)}{' '}
            puntos que se quedan fuera de la cuenta, sin sumar ni restar; por
            eso la confianza es del {formatConfidence(example.confidence)}.
          </p>
        )}
        <Link
          data-arrow
          href={companyRoutes(example.companyId).pulse}
          className="group mt-1 inline-flex w-fit items-center gap-1.5 font-medium leading-[1.2] text-ink"
        >
          Ver el PULSE completo de {companyName(example.companyId)}
          <i
            aria-hidden
            className="not-italic transition-transform group-hover:translate-x-1"
          >
            →
          </i>
        </Link>
      </div>
    </div>
  );
}
