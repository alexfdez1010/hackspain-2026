import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MethodPage from '@/app/method/page';
import { MethodConfidenceBar } from '@/components/method/confidence-bar';
import { MethodExamplePanel } from '@/components/method/example-panel';
import { MethodForecastTable } from '@/components/method/forecast-table';
import { MethodPipelineFlow } from '@/components/method/pipeline-flow';
import { MethodPricingPanel } from '@/components/method/pricing-panel';
import { MethodScopeList } from '@/components/method/scope-list';
import { MethodScoreEvaluation } from '@/components/method/score-evaluation';
import { MethodScoreScale } from '@/components/method/score-scale';
import { MethodWeightMap } from '@/components/method/weight-map';
import { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
import {
  buildConfidenceSegments,
  buildMethodExample,
} from '@/lib/method/example';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { EMPTY_EVALUATION } from '@/lib/pulse/parse-evaluation';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';

const { meta } = await new StaticPulseSource().getSummary();
const company = await new StaticPulseSource().getCompany(PULSE_DEMO_COMPANY_ID);
const catalogue = await new StaticAdvisorSource().getCatalogue();
const example = buildMethodExample(company, meta.variables, meta.pillars);
const lastMonth = company?.series[company.series.length - 1] ?? null;

/**
 * Renders the whole route for a query string.
 *
 * @param company - Company carried by `?company=`; omitted for no context.
 * @returns The static markup of the page.
 */
async function renderPage(company?: string): Promise<string> {
  return renderToStaticMarkup(
    await MethodPage({
      searchParams: Promise.resolve(company ? { company } : {}),
    }),
  );
}

describe('the method page renders on the server with the real export', () => {
  it('draws the scale with the four bands and their cuts', () => {
    const markup = renderToStaticMarkup(
      <MethodScoreScale caption="Último cierre: ago 2026." />,
    );
    expect(markup).toContain('Crítico');
    expect(markup).toContain('&lt; 35');
    expect(markup).toContain('35-50');
    expect(markup).toContain('&gt; 65');
    expect(markup).toContain('Último cierre: ago 2026.');
  });

  it('maps the 100 points and details the heaviest variable', () => {
    const markup = renderToStaticMarkup(
      <MethodWeightMap pillars={meta.pillars} variables={meta.variables} />,
    );
    expect(markup).toContain('Calidad de cobro');
    expect(markup).toContain('36 de 100');
    expect(markup).toContain('Tramo +90 días');
    expect(markup).toContain('12 de 100 puntos');
    expect(markup).toContain('Más bajo, más sano');
    expect(markup).toContain('ERP, cuentas a cobrar');
    expect(markup).toContain('Proxy bancario');
    expect(markup).toContain('aria-pressed="true"');
  });

  it('says that an empty export has no variables to map', () => {
    const markup = renderToStaticMarkup(
      <MethodWeightMap pillars={[]} variables={[]} />,
    );
    expect(markup).toContain('El export no publica las variables del score.');
  });

  it('lists the pipeline and the coverage of the demo month', () => {
    const steps = renderToStaticMarkup(<MethodPipelineFlow />);
    expect(steps).toContain('Normalización');
    expect(steps).toContain('Confianza');
    expect(steps).toContain('ni suma ni resta');

    const bar = renderToStaticMarkup(
      <MethodConfidenceBar
        segments={buildConfidenceSegments(meta.variables, lastMonth)}
        confidence={example?.confidence ?? null}
        caption="Cobertura real de COMP_0001."
      />,
    );
    expect(bar).toContain('82 de 100 puntos con datos');
    expect(bar).toContain('no cuenta, y tampoco resta como un cero');
  });

  it('works one month out to the PULSE of the month', () => {
    expect(example).not.toBeNull();
    const markup = renderToStaticMarkup(
      <MethodExamplePanel example={example!} />,
    );
    expect(markup).toContain('45,64');
    expect(markup).toContain('45,6');
    expect(markup).not.toContain('percentil');
    expect(markup).toContain('Utilización de líneas');
    expect(markup).toContain('/company/COMP_0001');
  });

  it('publishes the evaluation of the score with its caveat', () => {
    const markup = renderToStaticMarkup(
      <MethodScoreEvaluation
        score={meta.evaluation.score}
        variables={meta.variables}
      />,
    );
    expect(markup).toContain('0,821');
    expect(markup).toContain('0,870');
    expect(markup).toContain('Días de caja');
    expect(markup).toContain('decisión de diseño');
  });

  it('explains itself when the export carries no evaluation', () => {
    const score = renderToStaticMarkup(
      <MethodScoreEvaluation
        score={EMPTY_EVALUATION.score}
        variables={meta.variables}
      />,
    );
    expect(score).toContain('El export no publica la evaluación del score.');

    const forecast = renderToStaticMarkup(
      <MethodForecastTable
        horizons={EMPTY_EVALUATION.forecast}
        emptyText="El export no publica la validación de la previsión."
      />,
    );
    expect(forecast).toContain(
      'El export no publica la validación de la previsión.',
    );

    const pricing = renderToStaticMarkup(
      <MethodPricingPanel
        catalogue={{
          ...catalogue,
          products: [],
          riskModel: {
            rows: null,
            stressRate: null,
            auroc: null,
            coefficientsStd: {},
          },
        }}
      />,
    );
    expect(pricing).toContain('El export no publica el catálogo de productos.');
    expect(pricing).toContain('fijo por producto');
  });

  it('tabulates the forecast against persistence', () => {
    const markup = renderToStaticMarkup(
      <MethodForecastTable
        horizons={meta.evaluation.forecast}
        emptyText="sin validación"
      />,
    );
    expect(markup).toContain('+6 m');
    expect(markup).toContain('10,34');
    expect(markup).toContain('12,35');
    expect(markup).toContain('16,3 %');
  });

  it('stacks the price and publishes the catalogue', () => {
    const markup = renderToStaticMarkup(
      <MethodPricingPanel catalogue={catalogue} />,
    );
    expect(markup).toContain('Euríbor 12 m');
    expect(markup).toContain('2,10');
    expect(markup).toContain('900 pb');
    expect(markup).toContain('75 pb × (1 − confianza)');
    expect(markup).toContain('Línea de crédito');
    expect(markup).toContain('0,871');
    expect(markup).toContain('se ofrece a partir de 40');
  });

  it('states what the score does not do', () => {
    const markup = renderToStaticMarkup(<MethodScopeList />);
    expect(markup).toContain('No es una probabilidad de impago');
    expect(markup).toContain('aprobación del banco');
  });

  it('opens the route with the acronym, the scale and every section', async () => {
    const markup = await renderPage();
    expect(markup).toContain('Payment, Underwriting, Liquidity &amp; Solvency');
    expect(markup).toContain('Anatomía de los 100 puntos');
    expect(markup).toContain('Del extracto al score');
    expect(markup).toContain('Qué anticipa el score');
    expect(markup).toContain('Previsión a 12 meses');
    expect(markup).toContain('De la puntuación al producto');
    expect(markup).toContain('Qué no hace PULSE');
    expect(markup).toContain('Ver un PULSE: Atresmedia Labs');
    expect(markup).not.toContain('NaN');
  });

  it('keeps the company of the query in context and works its month', async () => {
    const markup = await renderPage('COMP_0051');
    expect(markup).toContain('Volver a Atlassian Global');
    expect(markup).toContain('href="/company/COMP_0051"');
    expect(markup).toContain('Ver el PULSE completo de Atlassian Global');
  });

  it('falls back to the demo company when the query names an unknown one', async () => {
    const markup = await renderPage('COMP_9999');
    expect(markup).toContain('href="/company/COMP_9999"');
    expect(markup).toContain('Ver el PULSE completo de Atresmedia Labs');
    expect(markup).toContain('href="/company/COMP_0001"');
  });
});
