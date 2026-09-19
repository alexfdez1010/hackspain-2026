import Link from 'next/link';

import { MethodExampleTable } from '@/components/method/example-table';
import type { MethodExample } from '@/lib/method/example';
import { formatConfidence } from '@/lib/pulse/format';
import { companyRoutes } from '@/lib/routes';
import { formatMonth, formatNumber } from '@/lib/format';

interface MethodExamplePanelProps {
  example: MethodExample;
}

/**
 * Reads one real month end to end: the contributions of the variables with
 * evidence, their sum, and the calibration that turns it into PULSE.
 *
 * Working the example on published figures is the point: the reader can repeat
 * the addition and land on the same score the company page shows.
 *
 * @param props - The worked example of the demo company.
 * @returns The table of contributions and the two sentences that close it.
 */
export function MethodExamplePanel({ example }: MethodExamplePanelProps) {
  const { rows, pulse, pulseRaw, contributionSum, unknownLabels } = example;
  return (
    <div className="flex flex-col gap-4">
      <MethodExampleTable rows={rows} />
      <div className="flex max-w-3xl flex-col gap-2 text-sm">
        <p>
          Los {formatNumber(rows.length)} aportes suman{' '}
          <span className="font-medium tabular-nums">
            {formatNumber(contributionSum, 2)}
          </span>
          , que es <code>pulse_raw</code> ({formatNumber(pulseRaw, 2)}). La
          calibración lo lleva a su percentil en la población: PULSE{' '}
          <span className="font-medium tabular-nums">
            {formatNumber(pulse, 1)}
          </span>
          , más sano que el {formatNumber(pulse, 0)} % de las empresas del
          conjunto.
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
          Ver el PULSE completo de {example.companyId}
        </Link>
      </div>
    </div>
  );
}
