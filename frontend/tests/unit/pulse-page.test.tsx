import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CompanyPulsePage, {
  generateMetadata,
} from '@/app/(app)/company/[id]/page';
import CompanyDiagnosisPage, {
  generateMetadata as diagnosisMetadata,
} from '@/app/(app)/company/[id]/diagnosis/page';
import CompanyDetailPage, {
  generateMetadata as detailMetadata,
} from '@/app/(app)/company/[id]/detail/page';

type Page = (props: {
  params: Promise<{ id: string }>;
}) => Promise<React.ReactElement>;

/**
 * Renders one company page for one identifier.
 *
 * @param page - Page component.
 * @param id - Company identifier.
 * @returns The static markup of the page.
 */
async function render(page: Page, id: string): Promise<string> {
  const params = Promise.resolve({ id });
  return renderToStaticMarkup(await page({ params }));
}

describe('the company summary page', () => {
  it('opens with the name, the group, the score and its four qualifiers', async () => {
    const markup = await render(CompanyPulsePage, 'COMP_0001');
    expect(markup).toContain('Atresmedia Labs');
    expect(markup).toContain('Grupo Ebro');
    expect(markup).toContain('8 meses observados hasta ago 2026');
    expect(markup).toContain('previsión mensual hasta feb 2027');
    expect(markup).toContain('PULSE del cierre de ago 2026');
    expect(markup).toContain('82 de 100 puntos de peso con datos');
    expect(markup).toContain('Días de caja');
    expect(markup).toContain('Salud de los clientes');
    expect(markup).toContain('3 clientes por facturación');
    expect(markup).not.toContain('Tensión a 6 meses');
  });

  it('keeps only the trajectory and the actions, in that order', async () => {
    const markup = await render(CompanyPulsePage, 'COMP_0001');
    expect(markup).toContain('8 cierres observados y 6 meses de previsión.');
    expect(markup.indexOf('Trayectoria')).toBeLessThan(
      markup.indexOf('Qué hacer ahora'),
    );
    expect(markup).not.toContain('Dónde se decide');
    expect(markup).not.toContain('Detalle de un mes');
    expect(markup).not.toContain('Cómo se calcula');
  });

  it('raises the open signal as an alert and flags every signal on the chart', async () => {
    const markup = await render(CompanyPulsePage, 'COMP_0001');
    expect(markup).toContain('Bache de 7 puntos en julio de 2026');
    expect(markup).toContain('hace 1 mes · abierta, 39 % de que dure');
    expect(markup).toContain('data-signal="caida"');
    expect(markup).toContain('data-signal="bache"');
    expect(markup).toContain('href="/company/COMP_0001/signals"');
  });

  it('titles the tab with the company and answers 404 for an unknown one', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'COMP_0001' }),
    });
    expect(metadata.title).toBe('Atresmedia Labs — PULSE · Embat Pulse');
    await expect(render(CompanyPulsePage, 'COMP_9999')).rejects.toThrow();
  });
});

describe('the company diagnosis page', () => {
  it('shows the mosaic and the pillars of the last close', async () => {
    const markup = await render(CompanyDiagnosisPage, 'COMP_0001');
    expect(markup).toContain('Diagnóstico del cierre de ago 2026');
    expect(markup).toContain('Dónde se decide');
    expect(markup).toContain('Calidad de cobro');
    expect(markup).not.toContain('pts de peso');
    expect(markup).toContain('Tramo +90 días');
    expect(markup).toContain('Utilización de líneas');
    expect(markup).toContain('Evolución por pilar');
    expect(markup).toMatch(/href="\/company\/COMP_0001\/variable\/\w+"/);
    expect(markup).not.toContain('NaN');
  });

  it('titles the tab and answers 404 for an unknown company', async () => {
    const metadata = await diagnosisMetadata({
      params: Promise.resolve({ id: 'COMP_0001' }),
    });
    expect(metadata.title).toBe('Atresmedia Labs — Diagnóstico · Embat Pulse');
    await expect(render(CompanyDiagnosisPage, 'COMP_9999')).rejects.toThrow();
  });
});

describe('the company detail page', () => {
  it('prints every observed month and every predicted month', async () => {
    const markup = await render(CompanyDetailPage, 'COMP_0001');
    for (const month of [
      'ene 2026',
      'feb 2026',
      'mar 2026',
      'abr 2026',
      'may 2026',
      'jun 2026',
      'jul 2026',
      'ago 2026',
    ]) {
      expect(markup).toContain(month);
    }
    expect(markup).toContain('8 cierres observados y 6 meses previstos');
    expect(markup).toContain('Meses previstos, aún sin cerrar');
    expect(markup).toContain('primer mes');
  });

  it('opens the month and the forecast decompositions', async () => {
    const markup = await render(CompanyDetailPage, 'COMP_0001');
    expect(markup).toContain('Aporte de cada variable, en puntos de PULSE');
    expect(markup).toContain('De dónde sale el cambio previsto');
    expect(markup).toContain('Base del modelo');
    expect(markup).toContain('2 de 11');
    expect(markup).not.toContain('NaN');
  });

  it('reads a company with two years of history and known credit lines', async () => {
    const markup = await render(CompanyDetailPage, 'COMP_0051');
    expect(markup).toContain('24 cierres observados');
    expect(markup).toContain('Utilización de líneas');
    expect(markup).not.toContain('NaN');
  });

  it('titles the tab and answers 404 for an unknown company', async () => {
    const metadata = await detailMetadata({
      params: Promise.resolve({ id: 'COMP_0001' }),
    });
    expect(metadata.title).toBe('Atresmedia Labs — Detalle · Embat Pulse');
    await expect(render(CompanyDetailPage, 'COMP_9999')).rejects.toThrow();
  });
});
