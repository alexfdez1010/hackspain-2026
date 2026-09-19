import { describe, expect, it, vi } from 'vitest';

import { parseAdvisorCatalogue } from '@/lib/advisor/parse-catalogue';
import { parseAdvisorCompany } from '@/lib/advisor/parse-company';
import { ApiAdvisorSource } from '@/lib/advisor/source/api';
import { createAdvisorDataSource } from '@/lib/advisor/source/factory';
import { StaticAdvisorSource } from '@/lib/advisor/source/static-json';
import { PULSE_DEMO_COMPANY_ID } from '@/lib/pulse/demo';

/**
 * Builds a `fetch` stub that answers a fixed map of paths.
 *
 * @param routes - Path fragment to JSON body map; unknown paths answer 404.
 * @returns The stub and the list of requested URLs.
 */
function stubFetch(routes: Record<string, unknown>) {
  const calls: string[] = [];
  const impl = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.push(url);
    const match = Object.keys(routes).find((path) => url.includes(path));
    if (!match) return new Response('not found', { status: 404 });
    return new Response(JSON.stringify(routes[match]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as unknown as typeof fetch;
  return { impl, calls };
}

describe('parseAdvisorCatalogue', () => {
  it('reads products, pricing constants and the risk model', () => {
    const catalogue = parseAdvisorCatalogue({
      generated_for: 'test',
      reference_rate: { label: 'Euríbor 12 m', value: 0.021 },
      pricing_parameters: {
        max_risk_premium_bps: 900,
        stress_to_default: 0.25,
      },
      products: [
        {
          key: 'credit_line',
          label_es: 'Línea de crédito',
          family: 'circulante',
          what_es: 'Póliza',
          rate_kind: 'cost',
          base_spread_bps: 150,
          lgd: 0.45,
          min_spread_bps: 40,
          max_spread_bps: 990,
          tenor_months: 12,
        },
        { key: 'treasury_deposit', rate_kind: 'yield' },
        {},
      ],
      risk_model: {
        oof_auroc: 0.871,
        coefficients_std: { pillar_liquidez: -1.9 },
      },
    });
    expect(catalogue.products).toHaveLength(2);
    expect(catalogue.products[0].label).toBe('Línea de crédito');
    expect(catalogue.products[1].rateKind).toBe('yield');
    expect(catalogue.referenceRate.value).toBe(0.021);
    expect(catalogue.pricingParameters.maxRiskPremiumBps).toBe(900);
    expect(catalogue.riskModel.auroc).toBe(0.871);
    expect(catalogue.riskModel.coefficientsStd.pillar_liquidez).toBe(-1.9);
  });

  it('degrades to an empty catalogue instead of throwing', () => {
    expect(parseAdvisorCatalogue(null).products).toEqual([]);
    expect(parseAdvisorCatalogue('nope').referenceRate.value).toBeNull();
  });
});

describe('parseAdvisorCompany', () => {
  const payload = {
    company_id: 'COMP_0001',
    month: '2026-08',
    pulse: 32.77,
    confidence: 0.82,
    pillars: { liquidez: 34.33 },
    reference_rate: { label: 'Euríbor 12 m', value: 0.021, source: 'default' },
    summary: 'tres productos encajan',
    risk: {
      p_stress_6m: 0.2811,
      base_rate: 0.2239,
      contributions: [
        {
          feature: 'confidence',
          label: 'Cobertura',
          value: 0.82,
          logit: -0.03,
        },
        {
          feature: 'pillar_liquidez',
          label: 'Liquidez',
          value: 34,
          logit: 1.1,
        },
      ],
    },
    recommendations: [
      {
        rank: 2,
        product: 'factoring',
        label: 'Anticipo de facturas',
        fit: 50,
        amount: 130000,
        annual_rate: 0.0565,
        spread_bps: 355,
        rate_kind: 'cost',
        headline: 'Factoring de 130.000 €',
        why: ['Caja corta'],
        reasons: [
          {
            code: 'caja_corta',
            text: 'Caja corta',
            kind: 'pro',
            points: 20,
            variable: 'cash_days',
            value: 14.03,
            unit: 'días',
          },
          { kind: 'contra' },
        ],
        sizing: {
          formula: '85 % de la cartera',
          inputs: { advance_rate: 0.85 },
        },
        pricing: {
          components: [{ key: 'referencia', label: 'Euríbor', bps: 210 }],
          clamped: false,
          spread_band_bps: [0, 790],
          annual_pd: 0.48,
          story: ['Total 5,65 %'],
        },
        levers: [
          {
            pillar: 'liquidez',
            label: 'Liquidez',
            current: 34.3,
            target: 60,
            premium_saving_bps: 176,
            variables: [
              { key: 'cash_min', label: 'Mínimo', score: 30.4, weight: 14 },
            ],
          },
        ],
        lever_story: ['Si subiera…'],
      },
      { rank: 1, product: 'credit_line', label: 'Línea de crédito' },
      { rank: 3 },
    ],
    declined: [
      {
        product: 'term_loan',
        label: 'Préstamo',
        status: 'no_elegible',
        reasons: ['PULSE 33 < 60'],
      },
      { product: 'refinancing', status: 'poco_encaje', fit: 15, reasons: [] },
    ],
    improvement_plan: {
      unlocks: ['Préstamo a plazo con PULSE 60'],
      levers: [],
      story: [],
    },
    inputs: {
      cash_end: 36982.49,
      monthly_outflow: 79093.67,
      holdings: { types: ['loan'], line_limit: 0, n_loans: 1 },
      invoices: { has_erp: true, open_ar: 156000.46 },
      outlook: { pulse_pred: 31.07, pulse_p10: 15.58, pulse_p90: 48.35 },
    },
    disclaimer: 'Propuesta orientativa',
  };

  it('orders offers by rank and keeps every explanation block', () => {
    const company = parseAdvisorCompany(payload);
    expect(company?.recommendations.map((offer) => offer.product)).toEqual([
      'credit_line',
      'factoring',
    ]);
    const factoring = company!.recommendations[1];
    expect(factoring.reasons).toHaveLength(1);
    expect(factoring.reasons[0].variable).toBe('cash_days');
    expect(factoring.pricing.spreadBand).toEqual([0, 790]);
    expect(factoring.pricing.components[0].bps).toBe(210);
    expect(factoring.levers[0].variables[0].weight).toBe(14);
    expect(factoring.sizing.inputs.advance_rate).toBe(0.85);
    expect(company?.declined[1].status).toBe('poco_encaje');
    expect(company?.declined[1].fit).toBe(15);
    expect(company?.improvementPlan.unlocks).toHaveLength(1);
    expect(company?.inputs.invoices.hasErp).toBe(true);
    expect(company?.inputs.outlook?.pulsePred).toBe(31.07);
    expect(company?.inputs.holdings.types).toEqual(['loan']);
  });

  it('orders the risk drivers by absolute size', () => {
    const company = parseAdvisorCompany(payload);
    expect(company?.risk.contributions.map((item) => item.feature)).toEqual([
      'pillar_liquidez',
      'confidence',
    ]);
    expect(company?.risk.pStress6m).toBe(0.2811);
  });

  it('rejects a payload without a company identifier', () => {
    expect(parseAdvisorCompany({ recommendations: [] })).toBeNull();
    expect(parseAdvisorCompany(null)).toBeNull();
  });
});

describe('createAdvisorDataSource', () => {
  it('falls back to the bundled JSON files without an API URL', () => {
    expect(createAdvisorDataSource({})).toBeInstanceOf(StaticAdvisorSource);
    expect(createAdvisorDataSource({ PULSE_API_URL: ' ' })).toBeInstanceOf(
      StaticAdvisorSource,
    );
  });

  it('uses the Advisor endpoints when the API URL is set', async () => {
    const { impl, calls } = stubFetch({
      '/api/pulse/recommendations/catalogue': { products: [{ key: 'x' }] },
      '/api/pulse/recommendations/COMP_0001': { company_id: 'COMP_0001' },
    });
    const source = createAdvisorDataSource(
      { PULSE_API_URL: 'http://localhost:8000/' },
      impl,
    );
    expect(source).toBeInstanceOf(ApiAdvisorSource);
    expect((await source.getCatalogue()).products).toHaveLength(1);
    expect((await source.getCompany('COMP_0001'))?.companyId).toBe('COMP_0001');
    expect(calls).toEqual([
      'http://localhost:8000/api/pulse/recommendations/catalogue',
      'http://localhost:8000/api/pulse/recommendations/COMP_0001',
    ]);
  });

  it('still honours the legacy XRAY_API_URL variable', () => {
    expect(
      createAdvisorDataSource({ XRAY_API_URL: 'http://localhost:8000' }),
    ).toBeInstanceOf(ApiAdvisorSource);
  });

  it('degrades to an empty catalogue when the service is down', async () => {
    const source = createAdvisorDataSource(
      { PULSE_API_URL: 'http://localhost:8000' },
      stubFetch({}).impl,
    );
    expect((await source.getCatalogue()).products).toEqual([]);
    expect(await source.getCompany('COMP_0001')).toBeNull();
  });
});

describe('StaticAdvisorSource', () => {
  const source = new StaticAdvisorSource();

  it('reads the bundled catalogue with seven products', async () => {
    const catalogue = await source.getCatalogue();
    expect(catalogue.products).toHaveLength(7);
    expect(catalogue.referenceRate.value).toBeGreaterThan(0);
    expect(catalogue.riskModel.auroc).toBeGreaterThan(0.5);
  });

  it('reads the demo company with priced offers whose parts add up', async () => {
    const company = await source.getCompany(PULSE_DEMO_COMPANY_ID);
    expect(company?.recommendations.length).toBeGreaterThan(0);
    for (const offer of company!.recommendations) {
      const spread = offer.pricing.components
        .filter((item) => item.key !== 'referencia')
        .reduce((total, item) => total + item.bps, 0);
      expect(spread).toBe(offer.spreadBps);
    }
  });

  it('refuses an unsafe identifier and answers null for an unknown one', async () => {
    expect(await source.getCompany('../catalogue')).toBeNull();
    expect(await source.getCompany('COMP_9999')).toBeNull();
  });
});
