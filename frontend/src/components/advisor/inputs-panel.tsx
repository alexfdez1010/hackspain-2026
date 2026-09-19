import { DefinitionList } from '@/components/advisor/definition-list';
import { LabelledBlock } from '@/components/advisor/labelled-block';
import { StatGrid, type StatItem } from '@/components/ui/stat-grid';
import { buildHoldingRows, buildInvoiceRows } from '@/lib/advisor/inputs-view';
import type { AdvisorInputs } from '@/lib/advisor/types';
import { formatEuro, formatNumber, formatSigned } from '@/lib/format';
import { formatBand, UNKNOWN_TEXT } from '@/lib/pulse/format';

interface InputsPanelProps {
  inputs: AdvisorInputs;
}

/**
 * Publishes every figure the rules read, so any amount, price or refusal on
 * this page can be checked against its source.
 *
 * @param props - Figures of the month behind the recommendation.
 * @returns The input block.
 */
export function InputsPanel({ inputs }: InputsPanelProps) {
  const stats: StatItem[] = [
    {
      key: 'cash_end',
      label: 'Caja a cierre de mes',
      value: formatEuro(inputs.cashEnd),
    },
    {
      key: 'outflow',
      label: 'Pagos operativos al mes',
      value: formatEuro(inputs.monthlyOutflow),
    },
    {
      key: 'collections',
      label: 'Cobros al mes',
      value: formatEuro(inputs.monthlyCollections),
    },
    {
      key: 'service',
      label: 'Vencimientos a 3 meses',
      value: formatEuro(inputs.service3m),
    },
    {
      key: 'trend',
      label: 'PULSE: cambio en 3 meses',
      value: formatSigned(inputs.pulseD3, 1),
      hint: 'Ajuste de tendencia del precio',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <StatGrid items={stats} columns={5} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <LabelledBlock title="Financiación en vigor" level={3}>
          <DefinitionList
            items={buildHoldingRows(inputs.holdings)}
            columns={1}
          />
        </LabelledBlock>
        <LabelledBlock title="Facturas abiertas" level={3}>
          <DefinitionList
            items={buildInvoiceRows(inputs.invoices)}
            columns={1}
          />
        </LabelledBlock>
        <LabelledBlock title="Previsión a +12 meses" level={3}>
          <DefinitionList
            columns={1}
            items={[
              {
                key: 'outlook',
                label: 'PULSE previsto',
                value: inputs.outlook
                  ? formatNumber(inputs.outlook.pulsePred, 1)
                  : UNKNOWN_TEXT,
                hint: inputs.outlook
                  ? `Banda p10-p90 ${formatBand(inputs.outlook.pulseP10, inputs.outlook.pulseP90)}`
                  : 'Sin previsión publicada para esta empresa',
              },
            ]}
          />
        </LabelledBlock>
      </div>
    </div>
  );
}
