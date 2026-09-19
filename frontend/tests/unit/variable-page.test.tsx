import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import CompanyVariablePage, {
  generateMetadata,
} from '@/app/(app)/company/[id]/variable/[key]/page';

/**
 * Renders the variable page of one company.
 *
 * @param id - Company identifier.
 * @param key - Variable key of the export.
 * @returns The static markup of the page.
 */
async function render(id: string, key: string): Promise<string> {
  const params = Promise.resolve({ id, key });
  return renderToStaticMarkup(await CompanyVariablePage({ params }));
}

describe('the variable page', () => {
  it('opens with the score, the raw value and the points of the last close', async () => {
    const markup = await render('COMP_0001', 'cash_days');
    expect(markup).toContain('Días de caja');
    expect(markup).toContain('39,0');
    expect(markup).toContain('14,0 días');
    expect(markup).toContain('5,70 de 12 pts');
    expect(markup).toContain('+16,7');
    expect(markup).toContain('Desde 22,3 puntos');
    expect(markup).toContain('8 de 8');
    expect(markup).not.toContain('NaN');
  });

  it('computes the figures over the whole observed history', async () => {
    const markup = await render('COMP_0001', 'cash_days');
    expect(markup).toContain('46,1');
    expect(markup).toContain('78,0');
    expect(markup).toContain('22,3');
    expect(markup).toContain('−39,1');
    expect(markup).toContain('Del primer al último mes con datos');
  });

  it('lists every observed month with its value and its contribution', async () => {
    const markup = await render('COMP_0001', 'cash_days');
    expect(markup).toContain('8 cierres observados');
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
    expect(markup).toContain('160,4 días');
    expect(markup).toContain('13,77 pts');
  });

  it('explains what the variable measures and what it is worth', async () => {
    const markup = await render('COMP_0001', 'cash_days');
    expect(markup).toContain('salida operativa diaria');
    expect(markup).toContain('Más alto, más sano');
    expect(markup).toContain('Extractos bancarios');
    expect(markup).toContain('12 de 100 puntos');
    expect(markup).toContain('Variable 1 de la especificación');
  });

  it('keeps the company in context and offers the two ways back', async () => {
    const markup = await render('COMP_0001', 'cash_days');
    expect(markup).toContain('href="/company/COMP_0001"');
    expect(markup).toContain('Volver al PULSE de Atresmedia Labs');
    expect(markup).toContain('href="/method?company=COMP_0001"');
    expect(markup).toContain('Cómo se calcula el PULSE');
  });

  it('navigates to the other ten variables of the same company', async () => {
    const markup = await render('COMP_0001', 'cash_days');
    expect(markup).toContain('Otras variables');
    expect(markup).toContain('href="/company/COMP_0001/variable/cash_min"');
    expect(markup).toContain('Mínimo intramensual de caja');
    expect(markup).toContain('aria-current="page"');
  });

  it('reads a variable without evidence as «sin datos», never as a zero', async () => {
    const markup = await render('COMP_0001', 'loc_util');
    expect(markup).toContain('Utilización de líneas');
    expect(markup).toContain('sin datos');
    expect(markup).toContain('0 de 8');
    expect(markup).toContain('Sin mes anterior con datos');
    expect(markup).not.toContain('NaN');
  });

  it('drills into the counterparties behind the variable of the month', async () => {
    const markup = await render('COMP_0001', 'network');
    expect(markup).toContain('Salud de pago de los clientes');
    expect(markup).toContain('Cierre de ago 2026');
    expect(markup).not.toContain('COUNTERPARTY_03903<');
  });

  it('answers 404 for an unknown variable, an unsafe key and an unknown company', async () => {
    await expect(render('COMP_0001', 'not_a_variable')).rejects.toThrow();
    await expect(render('COMP_0001', '../secret')).rejects.toThrow();
    await expect(render('COMP_9999', 'cash_days')).rejects.toThrow();
  });

  it('titles the tab with the variable and the company', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ id: 'COMP_0001', key: 'cash_days' }),
    });
    expect(metadata.title).toBe(
      'Días de caja · Atresmedia Labs — PULSE · Embat Pulse',
    );
    const fallback = await generateMetadata({
      params: Promise.resolve({ id: 'COMP_0001', key: 'nope' }),
    });
    expect(fallback.title).toBe('Atresmedia Labs — PULSE · Embat Pulse');
    const unsafe = await generateMetadata({
      params: Promise.resolve({ id: 'COMP_0001', key: '../secret' }),
    });
    expect(unsafe.title).toBe('Atresmedia Labs — PULSE · Embat Pulse');
  });
});
