import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PillarSparklines } from '@/components/charts/pillar-sparklines';
import { PulseTrajectoryChart } from '@/components/charts/pulse-trajectory';
import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseCompanyHeader } from '@/components/pulse/company-header';
import { PulseCompanyLinks } from '@/components/pulse/company-links';
import { PulseVariableHeatMap } from '@/components/pulse/variable-heat-map';
import { PulseForecastPanel } from '@/components/pulse/forecast-panel';
import { PulseForecastTable } from '@/components/pulse/forecast-table';
import { PulseMonthExplorer } from '@/components/pulse/month-explorer';
import { PulseMonthTable } from '@/components/pulse/month-table';
import { PulseSignalAlert } from '@/components/pulse/signal-alert';
import { companyName } from '@/lib/company/names';
import { companyRoutes } from '@/lib/routes';
import { buildTrajectory } from '@/lib/pulse/company-view';
import { getPulseDataSource } from '@/lib/pulse/data';
import { buildVariableHeatMap } from '@/lib/pulse/heat-map';
import { buildForecastRows, buildMonthRows } from '@/lib/pulse/history';
import { buildPillarSeries } from '@/lib/pulse/pillar-series';
import { formatMonth, formatNumber } from '@/lib/format';

interface CompanyPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Builds the tab title from the company name.
 *
 * @param props - Route parameters.
 * @returns Page metadata.
 */
export async function generateMetadata({
  params,
}: CompanyPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `${companyName(id)} — PULSE · Embat Pulse` };
}

/**
 * Writes the lead sentence: what the page covers and how far it reaches.
 *
 * @param months - Months with observed data.
 * @param lastMonth - Month of the last close.
 * @param horizonMonth - Farthest forecast month, or an empty string.
 * @returns One sentence naming the observed window and the forecast window.
 */
function buildLead(
  months: number,
  lastMonth: string,
  horizonMonth: string,
): string {
  const observed = `${formatNumber(months)} meses observados hasta ${formatMonth(lastMonth)}`;
  return horizonMonth
    ? `${observed}, con previsión mensual hasta ${formatMonth(horizonMonth)}.`
    : `${observed}. Sin previsión publicada.`;
}

/**
 * PULSE of one company, month by month: the score of the last close, the
 * alert when the score really moved recently, the full observed history with
 * its four pillars, the six predicted months and the decomposition of both
 * the current score and the prediction.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The company page, or a 404 when the identifier is unknown.
 */
export default async function CompanyPulsePage({ params }: CompanyPageProps) {
  const { id } = await params;
  const source = getPulseDataSource();
  const [company, summary] = await Promise.all([
    source.getCompany(id),
    source.getSummary(),
  ]);
  if (!company) notFound();

  const { meta } = summary;
  const { points, boundaryIndex } = buildTrajectory(
    company.series,
    company.forecast,
  );
  const monthRows = buildMonthRows(company.series);
  const forecastRows = buildForecastRows(company.forecast, company.pulse);
  const pillarSeries = buildPillarSeries(meta.pillars, company.series);
  const horizonMonth =
    company.forecast[company.forecast.length - 1]?.targetMonth ?? '';
  const lastPoint = company.series[company.series.length - 1] ?? null;
  const heatMap = buildVariableHeatMap(meta.pillars, meta.variables, lastPoint);

  return (
    <PageShell
      title={companyName(company.companyId)}
      lead={buildLead(company.monthsObserved, company.month, horizonMonth)}
      aside={<PulseCompanyLinks companyId={company.companyId} />}
    >
      <PulseCompanyHeader company={company} />
      <PulseSignalAlert
        company={company}
        href={companyRoutes(company.companyId).signals}
      />

      <Section
        title="Trayectoria"
        note="Escala 0-100; 50 es el umbral de vigilancia"
      >
        <PulseTrajectoryChart
          points={points}
          boundaryIndex={boundaryIndex}
          signals={company.signals}
        />
      </Section>

      <Section
        title="Mapa de calor"
        note={
          lastPoint
            ? `Cierre de ${formatMonth(lastPoint.month)}; el área es el peso y el color, el score de cada variable; pulsa una variable para abrir su página`
            : 'Sin mes observado'
        }
      >
        <PulseVariableHeatMap map={heatMap} companyId={company.companyId} />
      </Section>

      <Section
        title="Mes a mes"
        note={`${formatNumber(monthRows.length)} cierres observados y ${formatNumber(forecastRows.length)} meses previstos`}
      >
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">
            Meses observados, del más reciente al más antiguo
          </h3>
          <PulseMonthTable rows={monthRows} pillars={meta.pillars} />
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <h3 className="text-sm font-semibold">
            Meses previstos, aún sin cerrar
          </h3>
          <PulseForecastTable rows={forecastRows} baseMonth={company.month} />
        </div>
      </Section>

      <Section
        title="Evolución por pilar"
        note="Guías en 35, 50 y 65; misma escala en los cuatro"
      >
        <PillarSparklines series={pillarSeries} />
      </Section>

      <Section
        title="Detalle de un mes"
        note="Pilares, aportes y las 11 variables del mes elegido"
      >
        <PulseMonthExplorer
          series={company.series}
          pillars={meta.pillars}
          variables={meta.variables}
        />
      </Section>

      <Section
        title="Previsión desglosada"
        note="Aportes en puntos de PULSE, positivos a la derecha"
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
