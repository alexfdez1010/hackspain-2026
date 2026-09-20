import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import CompanyAdvisorPage from '@/app/(app)/company/[id]/recommendations/page';
import { ImprovementPlanPanel } from '@/components/advisor/improvement-plan';
import { InputsPanel } from '@/components/advisor/inputs-panel';
import { OfferRow } from '@/components/advisor/offer-row';
import { OutOfScopeList } from '@/components/advisor/out-of-scope';
import { RiskPanel } from '@/components/advisor/risk-panel';
import { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
import type { AdvisorCompany, AdvisorOffer } from '@/lib/advisor/types';
import { getPulseDataSource } from '@/lib/pulse/data';

const source = new StaticAdvisorSource();

/** Spanish label of every PULSE variable, as the page passes them down. */
let variableLabels: Record<string, string> = {};

/**
 * Reads a company of the bundled export, failing loudly when it is missing.
 *
 * @param id - Company identifier.
 * @returns The advisor answer of the company.
 */
async function load(id: string): Promise<AdvisorCompany> {
  const company = await source.getCompany(id);
  if (!company) throw new Error(`missing company ${id}`);
  return company;
}

/**
 * Renders one offer row with the labels of the score metadata.
 *
 * @param company - Company the offer belongs to.
 * @param index - Position of the offer in the recommendation list.
 * @returns The static markup of the row.
 */
function renderOffer(company: AdvisorCompany, index = 0): string {
  return renderToStaticMarkup(
    <OfferRow
      offer={company.recommendations[index]}
      referenceLabel={company.referenceRate.label}
      variableLabels={variableLabels}
    />,
  );
}

beforeAll(async () => {
  const { meta } = await getPulseDataSource().getSummary();
  variableLabels = Object.fromEntries(
    meta.variables.map((variable) => [variable.key, variable.label]),
  );
});

describe('an offer row', () => {
  it('argues the credit line of COMP_0001 from figures to levers', async () => {
    const company = await load('COMP_0001');
    const markup = renderOffer(company);
    expect(markup).toContain('Póliza de la que dispones');
    expect(markup).toContain('Línea de crédito');
    expect(markup).toContain('Circulante');
    expect(markup).toContain('45.000 €');
    expect(markup).toContain('a 12 meses');
    expect(markup).toContain('Ver detalle');
    expect(markup).toContain('9,17 %');
    expect(markup).toContain('+707 pb');
    expect(markup).toContain('aria-label="Qué significa Tipo"');
    expect(markup).toContain('aria-label="Qué significa Importe"');
    expect(markup).not.toContain('title="+707');
    expect(markup).toContain('Solicitar propuesta');
    expect(markup).toContain('encaje /100');
    expect(markup).toContain('Prima de riesgo');
    expect(markup).not.toContain('NaN');
  });

  it('ties every reason to its variable, its figure and its points', async () => {
    const markup = renderOffer(await load('COMP_0001'));
    expect(markup).toContain('A favor');
    expect(markup).not.toContain('En contra');
    expect(markup).toContain('+25 puntos de encaje');
    expect(markup).toContain('+20 puntos de encaje');
    expect(markup).toContain('Días de caja: 14,0 días');
  });

  it('shows the formula of the amount with every input it reads', async () => {
    const markup = renderOffer(await load('COMP_0001'));
    expect(markup).toContain('redondeado a 5.000');
    expect(markup).toContain('Meses de pagos cubiertos');
    expect(markup).toContain('0,60 meses');
    expect(markup).toContain('Pagos operativos al mes');
    expect(markup).toContain('79.094 €');
    expect(markup).toContain('Disponible en líneas');
  });

  it('breaks the price into a bar and the line each segment pays for', async () => {
    const markup = renderOffer(await load('COMP_0001'));
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Euríbor 12 m +210 pb;');
    expect(markup).toContain('Prima de riesgo <span class="tabular-nums">');
    expect(markup).toContain('+544 pb');
    expect(markup).toContain('Prima por incertidumbre de datos');
    expect(markup).toContain('Probabilidad de impago anual 48,3 %');
    expect(markup).toContain('pérdida esperada 544 pb');
    expect(markup).not.toContain('ajustado a la banda');
  });

  it('orders the levers by saving and names the one worth pulling first', async () => {
    const markup = renderOffer(await load('COMP_0001'));
    const liquidez = markup.indexOf('Pilar liquidez');
    const deuda = markup.indexOf('Pilar deuda y servicio');
    expect(liquidez).toBeGreaterThan(-1);
    expect(liquidez).toBeLessThan(deuda);
    expect(markup).toContain('−395 pb');
    expect(markup).toContain('mayor ahorro');
    expect(markup).toContain('28 % → 7 %');
    expect(markup).toContain('14 pts del PULSE');
  });

  it('prints the tenor of an amortising product on its row', async () => {
    const company = await load('COMP_0004');
    const markup = renderOffer(company);
    expect(markup).toContain('a 60 meses');
    expect(markup).toContain('16.617');
  });

  it('calls the rate of a deposit a yield and draws its discount hollow', async () => {
    const markup = renderOffer(await load('COMP_0002'));
    expect(markup).toContain('Remuneración anual');
    expect(markup).toContain('1,65 %');
    expect(markup).toContain('−60 pb');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('Tesorería');
    expect(markup).toContain(
      'Ningún pilar por debajo de 60: el precio ya no tiene margen',
    );
  });

  it('names the band when the spread was clamped and humanises a new input', async () => {
    const company = await load('COMP_0001');
    const offer: AdvisorOffer = {
      ...company.recommendations[0],
      sizing: { formula: 'Regla nueva', inputs: { new_ratio_key: 0.5 } },
      pricing: {
        ...company.recommendations[0].pricing,
        clamped: true,
        spreadBand: [40, 990],
      },
    };
    const markup = renderToStaticMarkup(
      <OfferRow
        offer={offer}
        referenceLabel="Euríbor 12 m"
        variableLabels={variableLabels}
      />,
    );
    expect(markup).toContain('Diferencial ajustado a la banda del producto');
    expect(markup).toContain('40 a 990 pb');
    expect(markup).toContain('New ratio key');
  });
});

describe('the products left out', () => {
  it('shows only the name until the reader opens the rule', async () => {
    const company = await load('COMP_0001');
    const markup = renderToStaticMarkup(
      <OutOfScopeList declined={company.declined} />,
    );
    expect(markup).toContain('Depósito de excedentes de tesorería');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('por debajo del mínimo de 60');
    expect(markup).not.toContain('No elegible');
    expect(markup).not.toContain('se ofrece desde 40');
  });

  it('says so when the whole catalogue is on the table', () => {
    const markup = renderToStaticMarkup(<OutOfScopeList declined={[]} />);
    expect(markup).toContain('Ningún producto del catálogo queda fuera.');
  });
});

describe('a company with no offer', () => {
  it('leads COMP_0007 with what it would take to unlock a product', async () => {
    const company = await load('COMP_0007');
    expect(company.recommendations).toHaveLength(0);
    expect(company.summary).toContain('no hay hoy un producto que encaje');
    const markup = renderToStaticMarkup(
      <ImprovementPlanPanel plan={company.improvementPlan} />,
    );
    expect(markup).toContain('Préstamo a plazo: se desbloquea con un PULSE');
    expect(markup).toContain('Pilar liquidez');
    expect(markup).toContain('mayor ahorro');
    expect(markup).not.toContain('Si tu pilar de liquidez subiera');
    expect(markup).toContain('objetivo · Neutro (50-65)');
    expect(markup).toContain('de prima de riesgo');
    expect(markup).not.toContain('NaN');
  });

  it('says the invoices are unobservable without an ERP', async () => {
    const company = await load('COMP_0007');
    const markup = renderToStaticMarkup(
      <InputsPanel inputs={company.inputs} />,
    );
    expect(markup).toContain('Sin ERP conectado');
    expect(markup).toContain(
      'Confirming, factoring, aval, línea de crédito, préstamo, renting',
    );
    expect(markup).toContain('4.150.001 €');
    expect(markup).toContain('24 préstamos');
    expect(markup).toContain('Banda p10-p90 31,3-61,3');
    expect(markup).toContain('sin datos');
  });
});

describe('the inputs of COMP_0001', () => {
  it('keeps a zero apart from a figure that does not exist', async () => {
    const company = await load('COMP_0001');
    const markup = renderToStaticMarkup(
      <InputsPanel inputs={company.inputs} />,
    );
    expect(markup).toContain('Ninguno contratado');
    expect(markup).toContain('0 €');
    expect(markup).toContain('El contrato no publica el tipo');
    expect(markup).toContain('156.000 €');
    expect(markup).toContain('−1,8');
  });
});

describe('the risk decomposition', () => {
  it('draws one bar per driver with the figure the model read', async () => {
    const company = await load('COMP_0001');
    const markup = renderToStaticMarkup(<RiskPanel risk={company.risk} />);
    expect(markup).toContain('Pilar liquidez');
    expect(markup).toContain('34,3/100');
    expect(markup).toContain('+1,11');
    expect(markup).toContain('Cobertura de datos');
    expect(markup).toContain('82 %');
    expect(markup).toContain('sube la probabilidad de tensión');
  });
});

describe('the advisor page', () => {
  /**
   * Renders the route for one company as the server would.
   *
   * @param id - Company identifier of the route.
   * @returns The static markup of the page.
   */
  async function renderPage(id: string): Promise<string> {
    const element = await CompanyAdvisorPage({
      params: Promise.resolve({ id }),
    });
    return renderToStaticMarkup(element);
  }

  it('opens COMP_0001 with what it can sign, then what the rules leave out', async () => {
    const markup = await renderPage('COMP_0001');
    expect(markup).toContain('<h1');
    expect(markup).toContain('3 productos encajan hoy');
    expect(markup).toContain('4 quedan fuera');
    expect(markup).not.toContain('Qué hacer ahora');
    expect(markup).not.toContain('Antes de financiar · sin coste');
    expect(markup).not.toContain(
      'Efecto en el PULSE si la variable llega a 100',
    );
    expect(markup).not.toContain('Coste financiero de la medida');
    expect(markup).not.toContain('Cuándo se ve en el PULSE');
    const approved = markup.indexOf('Si necesitas financiación');
    const outOfScope = markup.indexOf('Fuera de alcance hoy');
    const detail = markup.indexOf('Más detalle');
    expect(approved).toBeGreaterThan(-1);
    expect(approved).toBeLessThan(outOfScope);
    expect(outOfScope).toBeLessThan(detail);
    expect(markup).not.toContain('Aprobado con tu PULSE de hoy');
    expect(markup).toContain('Tu pilar más débil es deuda y servicio, en 34.');
    expect(markup).toContain('Línea de crédito');
    expect(markup).toContain('Anticipo de facturas');
    expect(markup.split('Solicitar propuesta').length - 1).toBe(3);
    expect(markup).toContain('+500 equipos financieros confían en nosotros');
    expect(markup.match(/aria-label="Qué significa Importe"/g)).toHaveLength(3);
    expect(markup).toContain('aria-label="Qué significa Tipo"');
    expect(markup).toContain('aria-label="Qué significa Encaje"');
    expect(markup).toContain('Ver detalle');
    expect(markup).toContain('Por qué encaja');
    expect(markup).toContain(
      'Abre cualquiera para ver la regla que lo deja fuera.',
    );
    expect(markup).toContain('Plan de mejora');
    expect(markup).toContain('Datos usados');
    expect(markup).toContain('Riesgo');
    expect(markup).toContain('Propuesta orientativa');
    expect(markup).not.toContain('Productos descartados');
    expect(markup).not.toContain('82 de 100 puntos con datos');
    expect(markup).not.toContain('NaN');
  });

  it('leads a company with no offer with what would unlock one', async () => {
    const markup = await renderPage('COMP_0007');
    expect(markup).toContain('quedan hoy fuera por sus reglas');
    expect(markup).toContain(
      'Hoy ningún producto supera el encaje mínimo de 40 con el PULSE de ago 2026',
    );
    expect(markup).toContain('Préstamo a plazo: se desbloquea');
    expect(markup).toContain('Fuera de alcance hoy');
    expect(markup).toContain('Más detalle');
    expect(markup).not.toContain('encaje /100');
    expect(markup).not.toContain('Solicitar propuesta');
  });
});
