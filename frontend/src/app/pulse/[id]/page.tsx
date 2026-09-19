import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PulseTrajectoryChart } from '@/components/charts/pulse-trajectory';
import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseCompanyHeader } from '@/components/pulse/company-header';
import { PulseForecastPanel } from '@/components/pulse/forecast-panel';
import { PulsePillarList } from '@/components/pulse/pillar-list';
import { PulseVariableTable } from '@/components/pulse/variable-table';
import { buildTrajectory, buildVariableRows } from '@/lib/pulse/company-view';
import { getPulseDataSource } from '@/lib/pulse/data';
import { formatMonth, formatNumber } from '@/lib/xray/format';

interface PulseCompanyPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Builds the tab title from the company identifier.
 *
 * @param props - Route parameters.
 * @returns Page metadata.
 */
export async function generateMetadata({
  params,
}: PulseCompanyPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id} — PULSE · Embat Pulse` };
}

/**
 * Company view of PULSE: score of the month, trajectory with forecast, pillars,
 * the eleven variables and the decomposition of the prediction.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The company page, or a 404 when the identifier is unknown.
 */
export default async function PulseCompanyPage({
  params,
}: PulseCompanyPageProps) {
  const { id } = await params;
  const source = getPulseDataSource();
  const [company, summary] = await Promise.all([
    source.getCompany(id),
    source.getSummary(),
  ]);
  if (!company) notFound();

  const { meta } = summary;
  const pillarLabels = Object.fromEntries(
    meta.pillars.map((pillar) => [pillar.key, pillar.label]),
  );
  const last = company.series[company.series.length - 1] ?? null;
  const { points, boundaryIndex } = buildTrajectory(
    company.series,
    company.forecast,
  );
  const variableRows = buildVariableRows(meta.variables, last, pillarLabels);
  const unknownCount = variableRows.filter((row) => !row.known).length;

  return (
    <PageShell
      title={company.companyId}
      lead={`PULSE de ${formatMonth(company.month)} con ${formatNumber(company.monthsObserved)} meses observados y previsión hasta ${formatMonth(company.forecast[company.forecast.length - 1]?.targetMonth ?? company.month)}.`}
    >
      <PulseCompanyHeader company={company} />

      <Section
        title="Trayectoria"
        note="Escala 0-100; 50 es el umbral de vigilancia"
      >
        <PulseTrajectoryChart points={points} boundaryIndex={boundaryIndex} />
      </Section>

      <Section title="Pilares" note={`Cierre ${formatMonth(company.month)}`}>
        <PulsePillarList
          pillars={meta.pillars}
          scores={last?.pillars ?? company.pillars}
        />
      </Section>

      <Section
        title="Variables"
        note={
          unknownCount === 0
            ? 'Las 11 variables tienen datos este mes'
            : `${formatNumber(unknownCount)} de ${formatNumber(variableRows.length)} variables sin datos este mes`
        }
      >
        <PulseVariableTable rows={variableRows} />
      </Section>

      <Section
        title="Previsión desglosada"
        note="Aportes en puntos de pulse_raw, positivos a la derecha"
      >
        <PulseForecastPanel
          forecast={company.forecast}
          variables={meta.variables}
          pulseNow={company.pulse}
        />
      </Section>
    </PageShell>
  );
}
