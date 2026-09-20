import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageShell, Section } from '@/components/layout/page-shell';
import { GroupPill } from '@/components/pulse/group-pill';
import { PulsePillarCards } from '@/components/pulse/pillar-cards';
import { PulseVariableMosaic } from '@/components/pulse/variable-mosaic';
import { companyName } from '@/lib/company/names';
import { companyPageTitle, loadCompanyPage } from '@/lib/pulse/company-page';
import { buildPulseMosaic } from '@/lib/pulse/mosaic';
import { buildPillarSeries } from '@/lib/pulse/pillar-series';
import { formatMonth } from '@/lib/format';

interface DiagnosisPageProps {
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
}: DiagnosisPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: companyPageTitle(id, 'Diagnóstico') };
}

/**
 * Where the score is decided: the eleven variables of the last close laid out
 * by pillar and weight, with the detail of any one of them, and how each
 * pillar has moved month by month.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The diagnosis page, or a 404 when the identifier is unknown.
 */
export default async function CompanyDiagnosisPage({
  params,
}: DiagnosisPageProps) {
  const { id } = await params;
  const data = await loadCompanyPage(id);
  if (!data) notFound();
  const { company, meta } = data;
  const lastPoint = company.series[company.series.length - 1] ?? null;
  const mosaic = buildPulseMosaic(meta.pillars, meta.variables, lastPoint);
  const pillarSeries = buildPillarSeries(meta.pillars, company.series);

  return (
    <PageShell
      title={companyName(company.companyId)}
      lead={`Diagnóstico del cierre de ${formatMonth(company.month)}: qué variables sostienen el PULSE y cuáles lo hunden.`}
      badge={<GroupPill groupId={company.groupId} />}
    >
      <Section title="Dónde se decide">
        <PulseVariableMosaic mosaic={mosaic} companyId={company.companyId} />
      </Section>

      <Section title="Evolución por pilar">
        <PulsePillarCards series={pillarSeries} />
      </Section>
    </PageShell>
  );
}
