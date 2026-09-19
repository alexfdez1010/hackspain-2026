import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseHeadlineTotal } from '@/components/pulse/headline-total';
import { PulsePlanPanel } from '@/components/pulse/plan-panel';
import { Panel } from '@/components/ui/panel';
import { StatGrid } from '@/components/ui/stat-grid';
import { companyPageTitle, loadCompanyPage } from '@/lib/pulse/company-page';
import { knownWeight } from '@/lib/pulse/gap';
import { buildPulseMosaic } from '@/lib/pulse/mosaic';
import { buildPulsePlanView } from '@/lib/pulse/plan-view';
import { companyRoutes, variableKeyFromParam } from '@/lib/routes';
import { formatNumber } from '@/lib/format';

interface PlanPageProps {
  params: Promise<{ id: string; key: string }>;
}

/**
 * Builds the tab title from the company name.
 *
 * @param props - Route parameters.
 * @returns Page metadata.
 */
export async function generateMetadata({
  params,
}: PlanPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: companyPageTitle(id, 'Acción') };
}

/**
 * The plan of one variable: what to do, why this variable holds the points,
 * what the measure costs and when it reaches the score.
 *
 * It is the page the action list opens, so the points at stake are computed
 * exactly as they are ranked there; nothing on it depends on financing, which
 * is one link away for the case where the operating measure is not enough.
 *
 * @param props - Route parameters carrying the company and the variable.
 * @returns The recommendation page, or a 404 when either key is unknown.
 */
export default async function CompanyPlanPage({ params }: PlanPageProps) {
  const { id, key } = await params;
  const variableKey = variableKeyFromParam(key);
  if (!variableKey) notFound();
  const data = await loadCompanyPage(id);
  if (!data) notFound();
  const { company, meta } = data;
  const lastPoint = company.series[company.series.length - 1] ?? null;
  const mosaic = buildPulseMosaic(meta.pillars, meta.variables, lastPoint);
  const cell = mosaic.cells.find((item) => item.key === variableKey);
  if (!cell) notFound();
  const view = buildPulsePlanView(cell, knownWeight(mosaic.cells));
  const routes = companyRoutes(company.companyId);

  return (
    <PageShell
      title={view.plan.title}
      lead={`${cell.label}, del pilar ${cell.pillarLabel}.`}
      aside={
        <PulseHeadlineTotal
          value={`+${formatNumber(view.points, 2)}`}
          caption="puntos de PULSE en juego"
        />
      }
    >
      <StatGrid
        items={view.figures.map((figure) => ({
          key: figure.key,
          label: figure.label,
          value: figure.value,
        }))}
      />

      <Section title="Qué hacer">
        <Panel>
          <PulsePlanPanel
            why={view.why}
            steps={view.plan.steps}
            actionHref={routes.action}
            advisorHref={routes.advisor}
          />
        </Panel>
      </Section>
    </PageShell>
  );
}
