import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CompanyActionsSection } from '@/components/actions/company-actions-panel';
import { PulseTrajectoryChart } from '@/components/charts/pulse-trajectory';
import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseCompanyHeader } from '@/components/pulse/company-header';
import { PulseForecastPanel } from '@/components/pulse/forecast-panel';
import { PulseForecastTable } from '@/components/pulse/forecast-table';
import { PulseMethodCards } from '@/components/pulse/method-cards';
import { PulseMonthExplorer } from '@/components/pulse/month-explorer';
import { PulseMonthTable } from '@/components/pulse/month-table';
import { PulsePillarCards } from '@/components/pulse/pillar-cards';
import { PulseSignalAlert } from '@/components/pulse/signal-alert';
import { PulseVariableMosaic } from '@/components/pulse/variable-mosaic';
import { Panel } from '@/components/ui/panel';
import { getAdvisorDataSource } from '@/lib/advisor/data';
import { companyName, groupName } from '@/lib/company/names';
import { companyRoutes } from '@/lib/routes';
import { buildTrajectory } from '@/lib/pulse/company-view';
import { getPulseDataSource } from '@/lib/pulse/data';
import { buildForecastRows, buildMonthRows } from '@/lib/pulse/history';
import { buildPulseMosaic } from '@/lib/pulse/mosaic';
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
 * PULSE of one company, month by month: the score of the last close on the
 * band scale, the alert when the score really moved, what to do now, where the
 * score is being decided, the four pillars, any observed month opened in full,
 * the predicted months with their decomposition and the arithmetic behind all
 * of it.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The company page, or a 404 when the identifier is unknown.
 */
export default async function CompanyPulsePage({ params }: CompanyPageProps) {
  const { id } = await params;
  const source = getPulseDataSource();
  const [company, summary, advisor] = await Promise.all([
    source.getCompany(id),
    source.getSummary(),
    getAdvisorDataSource().getCompany(id),
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
  const mosaic = buildPulseMosaic(meta.pillars, meta.variables, lastPoint);

  return (
    <PageShell
      title={companyName(company.companyId)}
      lead={buildLead(company.monthsObserved, company.month, horizonMonth)}
      aside={
        company.groupId ? (
          <span className="whitespace-nowrap rounded-full border border-hairline px-3 py-1.5 text-sm font-medium text-ink-secondary">
            {groupName(company.groupId)}
          </span>
        ) : undefined
      }
    >
      <PulseCompanyHeader
        company={company}
        pStress6m={advisor?.risk.pStress6m ?? null}
        baseRate={advisor?.risk.baseRate ?? null}
        cashEnd={advisor?.inputs.cashEnd ?? lastPoint?.cashEnd ?? null}
      />
      <PulseSignalAlert
        company={company}
        href={companyRoutes(company.companyId).signals}
      />

      <Section title="Trayectoria">
        <Panel>
          <PulseTrajectoryChart
            points={points}
            boundaryIndex={boundaryIndex}
            signals={company.signals}
          />
          <p className="mt-4 max-w-3xl text-[13px] text-ink-secondary">
            {formatNumber(monthRows.length)} cierres observados y{' '}
            {formatNumber(forecastRows.length)} meses de previsión.
          </p>
        </Panel>
      </Section>

      <CompanyActionsSection companyId={company.companyId} current="pulse" />

      <Section title="Dónde se decide">
        <PulseVariableMosaic mosaic={mosaic} companyId={company.companyId} />
      </Section>

      <Section title="Evolución por pilar">
        <PulsePillarCards series={pillarSeries} />
      </Section>

      <Section title="Detalle de un mes">
        <PulseMonthExplorer
          series={company.series}
          pillars={meta.pillars}
          variables={meta.variables}
        />
      </Section>

      <Section title="Previsión desglosada">
        <PulseForecastPanel
          forecast={company.forecast}
          variables={meta.variables}
          pulseNow={company.pulse}
        />
      </Section>

      <Section title="Mes a mes">
        <Panel>
          <h3 className="mb-4 text-sm font-medium text-ink-secondary">
            Meses observados, del más reciente al más antiguo
          </h3>
          <PulseMonthTable rows={monthRows} pillars={meta.pillars} />
          <h3 className="mb-4 mt-8 border-t border-hairline pt-6 text-sm font-medium text-ink-secondary">
            Meses previstos, aún sin cerrar
          </h3>
          <PulseForecastTable rows={forecastRows} baseMonth={company.month} />
        </Panel>
      </Section>

      <Section title="Cómo se calcula">
        <PulseMethodCards meta={meta} company={company} />
      </Section>
    </PageShell>
  );
}
