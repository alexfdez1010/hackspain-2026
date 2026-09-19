import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseForecastPanel } from '@/components/pulse/forecast-panel';
import { PulseForecastTable } from '@/components/pulse/forecast-table';
import { GroupPill } from '@/components/pulse/group-pill';
import { PulseMonthExplorer } from '@/components/pulse/month-explorer';
import { PulseMonthTable } from '@/components/pulse/month-table';
import { Panel } from '@/components/ui/panel';
import { companyName } from '@/lib/company/names';
import { companyPageTitle, loadCompanyPage } from '@/lib/pulse/company-page';
import { buildForecastRows, buildMonthRows } from '@/lib/pulse/history';
import { formatNumber } from '@/lib/format';

interface DetailPageProps {
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
}: DetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: companyPageTitle(id, 'Detalle') };
}

/**
 * The numbers behind the summary: any observed month opened in full, the
 * predicted months with their decomposition and the tables of every month.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The detail page, or a 404 when the identifier is unknown.
 */
export default async function CompanyDetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const data = await loadCompanyPage(id);
  if (!data) notFound();
  const { company, meta } = data;
  const monthRows = buildMonthRows(company.series);
  const forecastRows = buildForecastRows(company.forecast, company.pulse);

  return (
    <PageShell
      title={companyName(company.companyId)}
      lead={`${formatNumber(monthRows.length)} cierres observados y ${formatNumber(forecastRows.length)} meses previstos, uno a uno.`}
      aside={<GroupPill groupId={company.groupId} />}
    >
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
    </PageShell>
  );
}
