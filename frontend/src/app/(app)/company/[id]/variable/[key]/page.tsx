import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { VariableContributionChart } from '@/components/charts/variable/variable-contribution-chart';
import { VariableForecastChart } from '@/components/charts/variable/variable-forecast-chart';
import { VariableRawChart } from '@/components/charts/variable/variable-raw-chart';
import { VariableScoreChart } from '@/components/charts/variable/variable-score-chart';
import { VariableStandingBars } from '@/components/charts/variable/variable-standing-bars';
import { PageShell, Section } from '@/components/layout/page-shell';
import { PulseVariableDefinition } from '@/components/pulse/variable/variable-definition';
import { PulseVariableDetail } from '@/components/pulse/variable/variable-detail';
import { PulseVariableHeader } from '@/components/pulse/variable/variable-header';
import { PulseVariableLinks } from '@/components/pulse/variable/variable-links';
import { PulseVariableMonthTable } from '@/components/pulse/variable/variable-month-table';
import { PulseVariableNav } from '@/components/pulse/variable/variable-nav';
import { companyName } from '@/lib/company/names';
import { getPulseDataSource } from '@/lib/pulse/data';
import { detailTitle } from '@/lib/pulse/details/view';
import { buildVariableView, findVariable } from '@/lib/pulse/variable-view';
import { forecastNote, standingNote } from '@/lib/pulse/variable-notes';
import { variableKeyFromParam } from '@/lib/routes';
import { formatMonth, formatNumber } from '@/lib/format';

interface VariablePageProps {
  params: Promise<{ id: string; key: string }>;
}

/**
 * Builds the tab title from the variable and the company.
 *
 * @param props - Route parameters.
 * @returns Page metadata; the company alone when the key is unknown.
 */
export async function generateMetadata({
  params,
}: VariablePageProps): Promise<Metadata> {
  const { id, key } = await params;
  const name = companyName(id);
  const variableKey = variableKeyFromParam(key);
  if (!variableKey) return { title: `${name} — PULSE · Embat Pulse` };
  const { meta } = await getPulseDataSource().getSummary();
  const variable = findVariable(meta, variableKey);
  return {
    title: variable
      ? `${variable.label} · ${name} — PULSE · Embat Pulse`
      : `${name} — PULSE · Embat Pulse`,
  };
}

/**
 * One of the eleven variables of one company, month by month: the score of
 * the last close with the raw figure behind it, the points it puts into the
 * PULSE, its whole observed history and the definition that produced it.
 *
 * @param props - Route parameters carrying the company and the variable.
 * @returns The variable page, or a 404 when either identifier is unknown.
 */
export default async function CompanyVariablePage({
  params,
}: VariablePageProps) {
  const { id, key } = await params;
  const variableKey = variableKeyFromParam(key);
  if (!variableKey) notFound();
  const source = getPulseDataSource();
  const [company, summary, details] = await Promise.all([
    source.getCompany(id),
    source.getSummary(),
    source.getCompanyDetails(id),
  ]);
  if (!company) notFound();
  const { meta } = summary;
  const variable = findVariable(meta, variableKey);
  if (!variable) notFound();
  const view = buildVariableView(company, meta, variable);
  if (!view) notFound();
  const detailHeading = detailTitle(variable.key);

  return (
    <PageShell
      title={variable.label}
      lead={
        view.doc
          ? view.doc.measures
          : 'El método aún no documenta esta variable: esta página muestra su historia y su peso, no su definición.'
      }
      aside={<PulseVariableLinks companyId={company.companyId} />}
    >
      <PulseVariableHeader view={view} />

      <PulseVariableNav
        companyId={company.companyId}
        variables={meta.variables}
        currentKey={variable.key}
        pillars={meta.pillars}
      />

      <Section
        title="Score mes a mes"
        note="Escala 0-100 con guías en 35, 50 y 65; el pilar y el PULSE, en gris"
      >
        <VariableScoreChart
          points={view.points}
          label={variable.label}
          pillarLabel={view.pillar.label}
        />
      </Section>

      {details && detailHeading && (
        <Section
          title={detailHeading}
          note={`Detalle del cierre de ${formatMonth(details.month)}`}
        >
          <PulseVariableDetail variableKey={variable.key} details={details} />
        </Section>
      )}

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
        <Section title="Valor observado" note={`Cifra en ${variable.unit}`}>
          <VariableRawChart
            points={view.points}
            unit={variable.unit}
            better={view.doc?.better ?? null}
            label={variable.label}
          />
        </Section>
        <Section
          title="Puntos ganados"
          note={`De los ${formatNumber(variable.weight)} que puede aportar`}
        >
          <VariableContributionChart
            points={view.points}
            weight={variable.weight}
            label={variable.label}
          />
        </Section>
      </div>

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
        <Section
          title="Frente al resto de variables"
          note={
            view.last
              ? `Cierre de ${formatMonth(view.last.month)}; ${standingNote(view.standing.rankByScore, view.standing.knownCount)}`
              : 'Sin mes observado'
          }
        >
          <VariableStandingBars
            standing={view.standing}
            companyId={company.companyId}
          />
        </Section>
        <Section
          title="Peso en la previsión"
          note={forecastNote(view.forecast)}
        >
          <VariableForecastChart forecast={view.forecast} />
        </Section>
      </div>

      <Section
        title="Mes a mes"
        note={`${formatNumber(view.stats.total)} cierres observados, del más reciente al más antiguo`}
      >
        <PulseVariableMonthTable points={view.points} unit={variable.unit} />
      </Section>

      <Section
        title="Qué mide"
        note={`Variable del pilar ${view.pillar.label}`}
      >
        <PulseVariableDefinition view={view} />
      </Section>
    </PageShell>
  );
}
