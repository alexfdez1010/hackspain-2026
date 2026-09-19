import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

import CompanyAdvisorPage from '@/app/company/[id]/recommendations/page';
import { AdvisorHeader } from '@/components/advisor/advisor-header';
import { DeclinedList } from '@/components/advisor/declined-list';
import { ImprovementPlanPanel } from '@/components/advisor/improvement-plan';
import { InputsPanel } from '@/components/advisor/inputs-panel';
import { OfferCard } from '@/components/advisor/offer-card';
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
 * Renders one offer card with the labels of the score metadata.
 *
 * @param company - Company the offer belongs to.
 * @param index - Position of the offer in the recommendation list.
 * @returns The static markup of the card.
 */
function renderOffer(company: AdvisorCompany, index = 0): string {
  return renderToStaticMarkup(
    <OfferCard
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

describe('the advisor header', () => {
  it('opens with the score, its coverage, the stress risk and the reference', async () => {
    const company = await load('COMP_0001');
    const markup = renderToStaticMarkup(<AdvisorHeader company={company} />);
    expect(markup).toContain('45,6');
    expect(markup).toContain('82 %');
    expect(markup).toContain('82 de 100 puntos con datos');
    expect(markup).toContain('28 %');
    expect(markup).toContain('Cartera 22 %');
    expect(markup).toContain('Euríbor 12 m');
    expect(markup).toContain('2,10 %');
    expect(markup).not.toContain('NaN');
  });
});

describe('an offer card', () => {
  it('argues the credit line of COMP_0001 from figures to levers', async () => {
    const company = await load('COMP_0001');
    const markup = renderOffer(company);
    expect(markup).toContain('Recomendación 1');
    expect(markup).toContain('Línea de crédito');
    expect(markup).toContain('Circulante');
    expect(markup).toContain('45.000 €');
    expect(markup).toContain('12 meses');
    expect(markup).toContain('Tipo anual');
    expect(markup).toContain('9,17 %');
    expect(markup).toContain('+707 pb sobre Euríbor 12 m');
    expect(markup).toContain('85/100');
    expect(markup).toContain('Se ofrece desde 40');
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

  it('prints the instalment of an amortising product', async () => {
    const markup = renderOffer(await load('COMP_0004'));
    expect(markup).toContain('Cuota mensual');
    expect(markup).toContain('16.617 €');
    expect(markup).toContain('60 meses');
  });

  it('calls the rate of a deposit a yield and draws its discount hollow', async () => {
    const markup = renderOffer(await load('COMP_0002'));
    expect(markup).toContain('Remuneración anual');
    expect(markup).toContain('1,65 %');
    expect(markup).toContain('−60 pb');
    expect(markup).toContain('fill="none"');
    expect(markup).toContain('Excedente colocable');
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
      <OfferCard
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
  it('gives the rule that stopped each one', async () => {
    const company = await load('COMP_0001');
    const markup = renderToStaticMarkup(
      <DeclinedList declined={company.declined} />,
    );
    expect(markup).toContain('No elegible');
    expect(markup).toContain('Poco encaje');
    expect(markup).toContain('encaje 15/100 · se ofrece desde 40');
    expect(markup).toContain('chip--danger');
    expect(markup).toContain('por debajo del mínimo de 60');
    expect(markup).toContain('Depósito de excedentes de tesorería');
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
    expect(markup).toContain('Banda p10-p90 29,9-66,8');
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

  it('opens COMP_0001 with its summary, three offers and every section', async () => {
    const markup = await renderPage('COMP_0001');
    expect(markup).toContain('<h1');
    expect(markup).toContain('3 productos encajan hoy');
    expect(markup).toContain('4 quedan fuera');
    expect(markup).not.toContain('cobertura de datos');
    expect(markup).toContain('Por qué encaja');
    expect(markup).toContain('3 de 7 del catálogo, por orden de encaje');
    expect(markup).toContain('Línea de crédito');
    expect(markup).toContain('Anticipo de facturas');
    expect(markup).toContain('Productos descartados');
    expect(markup).toContain('Plan de mejora');
    expect(markup).toContain('Datos usados');
    expect(markup).toContain('Riesgo');
    expect(markup).toContain('Propuesta orientativa');
    expect(markup).not.toContain('NaN');
  });

  it('leads a company with no offer with the plan instead of an empty list', async () => {
    const markup = await renderPage('COMP_0007');
    expect(markup).not.toContain('Productos recomendados');
    expect(markup).toContain('Hoy ningún producto supera el encaje mínimo');
    expect(markup).toContain(
      'Ningún producto supera el encaje mínimo de 40 con el PULSE de ago 2026',
    );
    expect(markup).toContain('Préstamo a plazo: se desbloquea');
    expect(markup).toContain('Productos descartados');
  });
});
