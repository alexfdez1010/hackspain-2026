import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CompanyActionsSection } from '@/components/actions/company-actions-panel';
import { PulseTrajectoryChart } from '@/components/charts/pulse-trajectory';
import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseCompanyHeader } from '@/components/pulse/company-header';
import { GroupPill } from '@/components/pulse/group-pill';
import { PulseSignalAlert } from '@/components/pulse/signal-alert';
import { Panel } from '@/components/ui/panel';
import { companyName } from '@/lib/company/names';
import { companyRoutes } from '@/lib/routes';
import { companyPageTitle, loadCompanyPage } from '@/lib/pulse/company-page';
import { buildTrajectory } from '@/lib/pulse/company-view';
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
  return { title: companyPageTitle(id, 'PULSE') };
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
 * Summary of one company: the score of the last close on the band scale, the
 * alert when the score really moved, the trajectory with its forecast and
 * what to do now. Where the score is decided and the month-level detail
 * live on their own pages.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The summary page, or a 404 when the identifier is unknown.
 */
export default async function CompanyPulsePage({ params }: CompanyPageProps) {
  const { id } = await params;
  const data = await loadCompanyPage(id, true);
  if (!data) notFound();
  const { company, advisor } = data;
  const { points, boundaryIndex } = buildTrajectory(
    company.series,
    company.forecast,
  );
  const horizonMonth =
    company.forecast[company.forecast.length - 1]?.targetMonth ?? '';
  const lastPoint = company.series[company.series.length - 1] ?? null;

  return (
    <PageShell
      title={companyName(company.companyId)}
      lead={buildLead(company.monthsObserved, company.month, horizonMonth)}
      aside={<GroupPill groupId={company.groupId} />}
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
            {formatNumber(company.series.length)} cierres observados y{' '}
            {formatNumber(company.forecast.length)} meses de previsión.
          </p>
        </Panel>
      </Section>

      <CompanyActionsSection companyId={company.companyId} current="pulse" />
    </PageShell>
  );
}
