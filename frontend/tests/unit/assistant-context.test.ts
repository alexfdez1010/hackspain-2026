import { describe, expect, it, vi } from 'vitest';
import { getAssistantContext } from '@/lib/assistant/context';
import { getMockReply } from '@/lib/assistant/mock';
import { makeForecastPoint, makeSeriesPoint } from './pulse-fixtures';

/** Supplies a deterministic PULSE adapter; no filesystem or backend is consulted. */
function pulseSource(company: unknown = null) {
  return {
    kind: 'static' as const,
    getSummary: vi.fn().mockResolvedValue({
      meta: {
        lastMonth: '2026-08',
        scoreName: 'PULSE',
        horizons: [1, 6],
        pillars: [],
        variables: [],
      },
      companies: [],
    }),
    getCompany: vi.fn().mockResolvedValue(company),
  };
}

/** Supplies a deterministic Advisor adapter. */
function advisorSource(recommendation: unknown = null) {
  return { getCompany: vi.fn().mockResolvedValue(recommendation) };
}

/** A company with one observed month and one forecast horizon. */
function company(overrides: Record<string, unknown> = {}) {
  return {
    companyId: 'COMP_0001',
    groupId: 'GROUP_0147',
    monthsObserved: 8,
    month: '2026-08',
    pulse: 40,
    pulsePrev: 35,
    confidence: 0.8,
    pillars: { liquidez: 40 },
    series: [makeSeriesPoint()],
    forecast: [makeForecastPoint()],
    ...overrides,
  };
}

/** A recommendation with one priced offer. */
function recommendation() {
  return {
    companyId: 'COMP_0001',
    summary: 'PULSE 40: 1 producto encaja',
    risk: { pStress6m: 0.28, baseRate: 0.22, contributions: [] },
    referenceRate: { label: 'Euríbor 12 m', value: 0.021, source: 'default' },
    recommendations: [
      {
        rank: 1,
        label: 'Línea de crédito',
        headline: 'Línea de crédito de 25.000 €',
        fit: 75,
        amount: 25_000,
        annualRate: 0.0917,
        rateKind: 'cost',
        spreadBps: 707,
        why: ['Tu caja cubre 14 días de pagos.'],
        leverStory: ['Si tu liquidez subiera…'],
      },
    ],
    declined: [
      { label: 'Préstamo', status: 'no_elegible', reasons: ['PULSE < 60'] },
    ],
    improvementPlan: { unlocks: [], levers: [], story: [] },
  };
}

describe('trusted assistant context', () => {
  it('never carries the portfolio: without a company only metadata travels', async () => {
    const pulse = pulseSource();
    const advisor = advisorSource();
    const context = await getAssistantContext('/', 'Hola', pulse, advisor);
    expect(pulse.getCompany).not.toHaveBeenCalled();
    expect(advisor.getCompany).not.toHaveBeenCalled();
    expect(context.page).toBe('Embat Pulse');
    expect(context.provenance).toBe('Dataset local PULSE');
    expect(context.company).toBeNull();
    expect(context.advisor).toBeNull();
    expect(context).not.toHaveProperty('stats');
    expect(context.sources).toEqual([{ label: 'Método', href: '/method' }]);
    expect(getMockReply('Resume mi cartera', context)).toContain(
      'una empresa cada vez',
    );
  });

  it('gives an explicitly mentioned company precedence over the page', async () => {
    const pulse = pulseSource();
    const advisor = advisorSource();
    await getAssistantContext(
      '/company/COMP_0001',
      'Revisa comp_0002',
      pulse,
      advisor,
    );
    expect(pulse.getCompany).toHaveBeenCalledWith('COMP_0002');
    expect(advisor.getCompany).toHaveBeenCalledWith('COMP_0002');
  });

  it('links the company pages only when the export has the company', async () => {
    const context = await getAssistantContext(
      '/company/COMP_0001/recommendations',
      'Resume esta empresa',
      pulseSource(company()),
      advisorSource(recommendation()),
    );
    expect(context.page).toBe('Recomendaciones · Atresmedia Labs');
    expect(context.company?.name).toBe('Atresmedia Labs');
    expect(context.company?.change).toBe(5);
    expect(context.company?.unknownVariables).toEqual(['loc_util']);
    expect(context.advisor?.offers[0].label).toBe('Línea de crédito');
    expect(context.advisor?.leverStory).toEqual(['Si tu liquidez subiera…']);
    expect(context.sources.map((source) => source.href)).toEqual([
      '/company/COMP_0001',
      '/company/COMP_0001/recommendations',
      '/method',
    ]);

    const missing = await getAssistantContext(
      '/company/COMP_9999',
      'Resume esta empresa',
      pulseSource(),
      advisorSource(),
    );
    expect(missing.company).toBeNull();
    expect(
      missing.sources.some((entry) => entry.href.includes('COMP_9999')),
    ).toBe(false);
    expect(getMockReply('Resume esta empresa', missing)).toContain(
      'No hay datos de',
    );
  });

  it('names the variable page and keeps the company of the path', async () => {
    const pulse = pulseSource(company());
    const context = await getAssistantContext(
      '/company/COMP_0001/variable/cash_days',
      '¿Qué mide esta variable?',
      pulse,
      advisorSource(),
    );
    expect(pulse.getCompany).toHaveBeenCalledWith('COMP_0001');
    expect(context.page).toBe('Variable cash_days · Atresmedia Labs');
    expect(context.company?.name).toBe('Atresmedia Labs');
  });

  it('answers product questions from the recommendation of the company', async () => {
    const context = await getAssistantContext(
      '/company/COMP_0001',
      '¿Qué productos me recomiendas?',
      pulseSource(company()),
      advisorSource(recommendation()),
    );
    const reply = getMockReply('¿Qué productos me recomiendas?', context);
    expect(reply).toContain('Línea de crédito');
    expect(reply).toContain('9,17');
    expect(reply).toContain('encaje 75/100');
    expect(reply).toContain('28 %'.replace(' ', ' '));
  });
});
