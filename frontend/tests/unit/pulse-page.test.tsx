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
  it('names the company, the observed window and the forecast window', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('COMP_0001');
    expect(markup).toContain('8 meses observados hasta ago 2026');
    expect(markup).toContain('previsión mensual hasta feb 2027');
    expect(markup).toContain('32,8');
    expect(markup).toContain('82 de 100 puntos con datos');
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
    expect(markup).toContain('8 cierres observados y 6 meses previstos');
    expect(markup).toContain('Meses previstos, aún sin cerrar');
    expect(markup).toContain('primer mes');
  });

  it('shows the pillars, the eleven variables and the two decompositions', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('Evolución por pilar');
    expect(markup).toContain('Puntos que aporta cada variable');
    expect(markup).toContain('Tramo +90 días');
    expect(markup).toContain('Utilización de líneas');
    expect(markup).toContain('Base del modelo');
    expect(markup).toContain('2 de 11 variables sin datos');
    expect(markup).not.toContain('NaN');
  });

  it('offers the recommendations and the method of the same company', async () => {
    const markup = await render('COMP_0001');
    expect(markup).toContain('href="/company/COMP_0001/recommendations"');
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
