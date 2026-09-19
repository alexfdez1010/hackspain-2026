import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CompanyPulsePage, {
  generateMetadata,
} from '@/app/(app)/company/[id]/page';

/**
 * Renders the company page for one identifier.
 *
 * @param id - Company identifier.
 * @returns The static markup of the page.
 */
async function render(id: string): Promise<string> {
  const params = Promise.resolve({ id });
  return renderToStaticMarkup(await CompanyPulsePage({ params }));
}

describe('the company PULSE page', () => {
  it('opens with the name, the group, the score and its four qualifiers', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('Atresmedia Labs');
    expect(markup).toContain('Grupo Ebro');
    expect(markup).toContain('8 meses observados hasta ago 2026');
    expect(markup).toContain('previsión mensual hasta feb 2027');
    expect(markup).toContain('32,8');
    expect(markup).toContain('PULSE del cierre de ago 2026');
    expect(markup).toContain('82 de 100 puntos de peso con datos');
    expect(markup).toContain('Tensión a 6 meses');
  });

  it('prints every observed month and every predicted month', async () => {
    const markup = await render('COMP_0001');
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
    expect(markup).toContain('8 cierres observados y 6 meses de previsión.');
    expect(markup).toContain('Meses previstos, aún sin cerrar');
    expect(markup).toContain('primer mes');
  });

  it('lays the sections out in the order of the brief', async () => {
    const markup = await render('COMP_0001');
    const order = [
      'Trayectoria',
      'Qué hacer ahora',
      'Dónde se decide',
      'Evolución por pilar',
      'Detalle de un mes',
      'Previsión desglosada',
      'Mes a mes',
      'Cómo se calcula',
    ];
    const positions = order.map((title) => markup.indexOf(title));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('shows the mosaic, the pillars and the two decompositions', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('36 pts de peso');
    expect(markup).toContain('Tramo +90 días');
    expect(markup).toContain('Utilización de líneas');
    expect(markup).toContain('Aporte de cada variable, en puntos de PULSE');
    expect(markup).toContain('De dónde sale el cambio previsto');
    expect(markup).toContain('Base del modelo');
    expect(markup).toContain('2 de 11 variables');
    expect(markup).not.toContain('NaN');
  });

  it('closes with the formulas and the card of the model', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('confianza = Σ(pesos con dato) / 100');
    expect(markup).toContain('36 · 26 · 26 · 12 de 100');
    expect(markup).toContain('ene 2026 – ago 2026');
  });

  it('raises the open signal as an alert and flags every signal on the chart', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('Bache de 7 puntos en julio de 2026');
    expect(markup).toContain('hace 1 mes · abierta, 39 % de que dure');
    expect(markup).toContain('data-signal="caida"');
    expect(markup).toContain('data-signal="bache"');
  });

  it('offers the signals, the variables and the method of the same company', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('href="/company/COMP_0001/signals"');
    expect(markup).toMatch(/href="\/company\/COMP_0001\/variable\/\w+"/);
    expect(markup).toContain('href="/method?company=COMP_0001"');
  });

  it('reads a company with two years of history and known credit lines', async () => {
    const markup = await render('COMP_0051');
    expect(markup).toContain('24 meses observados');
    expect(markup).toContain('Utilización de líneas');
    expect(markup).not.toContain('NaN');
  });

  it('titles the tab with the company and answers 404 for an unknown one', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'COMP_0001' }),
    });
    expect(metadata.title).toBe('Atresmedia Labs — PULSE · Embat Pulse');
    await expect(render('COMP_9999')).rejects.toThrow();
  });
});
