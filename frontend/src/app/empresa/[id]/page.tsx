import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { PillarBars } from '@/components/charts/pillar-bars';
import { ScoreTimeline } from '@/components/charts/score-timeline';
import { CapitalCard } from '@/components/company/capital-card';
import { CompanyHeader } from '@/components/company/company-header';
import { KpiTable } from '@/components/company/kpi-table';
import { WhyPanel } from '@/components/company/why-panel';
import { PageShell, Section } from '@/components/layout/page-shell';
import { AlertList } from '@/components/monitor/alert-list';
import { getDataSource } from '@/lib/xray/data';

interface CompanyPageProps {
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
}: CompanyPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `${id} — Radiografía · Embat Pulse` };
}

/**
 * Company X-ray: score history, pillars, drivers, raw figures and the credit
 * line the score unlocks.
 *
 * @param props - Route parameters carrying the company identifier.
 * @returns The company page, or a 404 when the identifier is unknown.
 */
export default async function CompanyPage({ params }: CompanyPageProps) {
  const { id } = await params;
  const source = getDataSource();
  const [detail, meta] = await Promise.all([
    source.getCompany(id),
    source.getMeta(),
  ]);
  if (!detail) notFound();

  const { company, alerts, offer, offerHistory, avgMonthlyInflow } = detail;
  const series = company.series ?? [];
  const last = series[series.length - 1];
  const sixMonthsAgo = series.length >= 7 ? series[series.length - 7] : null;

  return (
    <PageShell
      title={company.company_id}
      lead={`Grupo ${company.group_id} · ${series.length} meses de extractos bancarios, facturas y deuda.`}
    >
      <CompanyHeader company={company} />

      <Section
        title="Score mensual"
        note="Escala 0-100; 50 es el umbral de vigilancia"
      >
        <ScoreTimeline series={series} trend6m={company.trend_6m} />
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section
          title="Pilares"
          note={
            sixMonthsAgo
              ? 'Barra: hoy · marca: hace 6 meses'
              : 'Sin comparación a seis meses'
          }
        >
          <PillarBars
            current={company.pillars}
            previous={sixMonthsAgo?.pillars ?? null}
            labels={meta.pillarLabels}
          />
        </Section>

        <Section title="Por qué este score" note="Contribución SHAP en puntos">
          <WhyPanel company={company} pillarLabels={meta.pillarLabels} />
        </Section>
      </div>

      <Section title="Línea de circulante">
        <CapitalCard
          offer={offer}
          history={offerHistory}
          avgMonthlyInflow={avgMonthlyInflow}
        />
      </Section>

      {last && (
        <Section title="Datos del último mes">
          <KpiTable raw={last.raw} month={last.month} />
        </Section>
      )}

      <Section title="Alertas de esta empresa">
        <AlertList
          alerts={alerts}
          hideCompany
          emptyText="El monitor no ha disparado ninguna alerta para esta empresa."
        />
      </Section>
    </PageShell>
  );
}
