import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseGapTable } from '@/components/pulse/gap-table';
import { PulseHeadlineTotal } from '@/components/pulse/headline-total';
import { companyName } from '@/lib/company/names';
import { companyPageTitle, loadCompanyPage } from '@/lib/pulse/company-page';
import { buildPulseGapBoard } from '@/lib/pulse/gap';
import { buildPulseMosaic } from '@/lib/pulse/mosaic';
import { formatMonth, formatNumber } from '@/lib/format';

interface ActionPageProps {
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
}: ActionPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: companyPageTitle(id, 'Acción') };
}

/**
 * The three variables where the company has the most points of PULSE to gain,
 * each with the plan that would collect them.
 *
 * The ranking is the mirror image of the contribution: every variable is worth
 * `peso · (100 − score) / peso con dato`, so the page answers «where are the
 * missing points», which is a different question from «which score is lowest».
 *
 * The ranking sits directly on the page: each step is already a card washed
 * with its band, so a panel around the three would draw a border around
 * borders and add nothing the wash does not say.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The action page, or a 404 when the identifier is unknown.
 */
export default async function CompanyActionPage({ params }: ActionPageProps) {
  const { id } = await params;
  const data = await loadCompanyPage(id);
  if (!data) notFound();
  const { company, meta } = data;
  const lastPoint = company.series[company.series.length - 1] ?? null;
  const mosaic = buildPulseMosaic(meta.pillars, meta.variables, lastPoint);
  const board = buildPulseGapBoard(mosaic);

  return (
    <PageShell
      title="Los tres siguientes pasos"
      lead="Foco en lo importante."
      aside={
        <PulseHeadlineTotal
          value={formatNumber(board.total, 2)}
          caption="puntos de PULSE en juego en estos tres pasos"
        />
      }
    >
      <Section
        title="Dónde están los puntos"
        note={`${companyName(company.companyId)} · cierre de ${formatMonth(company.month)}`}
      >
        <PulseGapTable board={board} companyId={company.companyId} />
      </Section>
    </PageShell>
  );
}
