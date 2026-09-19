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
    <div className="flex flex-col gap-4">
      <MethodExampleTable rows={rows} />
      <div className="flex max-w-3xl flex-col gap-2 text-sm">
        <p>
          Los {formatNumber(rows.length)} aportes suman{' '}
          <span className="font-medium tabular-nums">
            {formatNumber(contributionSum, 2)}
          </span>
          , que es el PULSE del mes:{' '}
          <span className="font-medium tabular-nums">
            {formatNumber(pulse, 1)}
          </span>
          . No hay ninguna transformación después: el score es la media
          ponderada de las variables con datos.
        </p>
        {unknownLabels.length > 0 && (
          <p className="text-muted">
            Sin datos en {formatMonth(example.month)}:{' '}
            {unknownLabels.join(', ')} — {formatNumber(example.unknownWeight)}{' '}
            puntos que no entran en la media ni como cero, de ahí una confianza
            del {formatConfidence(example.confidence)}.
          </p>
        )}
        <Link
          className="w-fit text-accent underline-offset-4 hover:underline"
          href={companyRoutes(example.companyId).pulse}
        >
          Ver el PULSE completo de {companyName(example.companyId)}
        </Link>
      </div>
    </div>
  );
}
