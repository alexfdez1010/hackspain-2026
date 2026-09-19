import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import MethodPage from '@/app/(app)/method/page';
import { MethodConfidenceBar } from '@/components/method/confidence-bar';
import { MethodExamplePanel } from '@/components/method/example-panel';
import { MethodOutlookList } from '@/components/method/outlook-list';
import { MethodPipelineFlow } from '@/components/method/pipeline-flow';
import { MethodScoreScale } from '@/components/method/score-scale';
import { MethodWeightMap } from '@/components/method/weight-map';
import {
  buildConfidenceSegments,
  buildMethodExample,
} from '@/lib/method/example';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';

const { meta } = await new StaticPulseSource().getSummary();
const company = await new StaticPulseSource().getCompany(PULSE_DEMO_COMPANY_ID);
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
    expect(steps).toContain('Cada nota vale sus puntos');
    expect(steps).toContain('simplemente no cuenta');
    expect(steps).not.toContain('percentil');

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

  it('sums up forecast, price and limits in plain words', () => {
    const markup = renderToStaticMarkup(
      <MethodOutlookList
        forecast={meta.evaluation.forecast}
        lastHorizon={12}
      />,
    );
    expect(markup).toContain('próximos 12 meses');
    expect(markup).toContain('A 6 meses ve venir');
    expect(markup).toContain('de cada 10 caídas grandes');
    expect(markup).toContain('No es una probabilidad de impago');
    expect(markup).not.toContain('AUROC');
    expect(markup).not.toContain('MAE');
  });

  it('keeps the summary without a figure when nothing is evaluated', () => {
    const markup = renderToStaticMarkup(
      <MethodOutlookList forecast={[]} lastHorizon={12} />,
    );
    expect(markup).toContain('Es un aviso, no una promesa');
    expect(markup).not.toContain('ve venir');
  });

  it('opens the route with the acronym, the scale and every section', async () => {
    const markup = await renderPage();
    expect(markup).toContain('Payment, Underwriting, Liquidity &amp; Solvency');
    expect(markup).toContain('Los 100 puntos');
    expect(markup).toContain('Cómo se calcula');
    expect(markup).toContain('Un mes real, sumado a mano');
    expect(markup).toContain('Previsión, precio y límites');
    expect(markup).not.toContain('AUROC');
    expect(markup).not.toContain('Catálogo');
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
