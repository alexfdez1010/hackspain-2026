import { describe, expect, it, vi } from 'vitest';
import { buildChart, chartModelOutput } from '@/lib/assistant/charts/build';
import { buildRankingRows } from '@/lib/assistant/charts/ranking';
import {
  NO_COMPANY_ERROR,
  ToolRuntime,
  UNKNOWN_COMPANY_ERROR,
  round,
  type ToolContext,
} from '@/lib/assistant/tools/context';
import { createAssistantTools } from '@/lib/assistant/tools';
import {
  ASSISTANT_TOOL_NAMES,
  isAssistantToolPartType,
  toolNameOf,
} from '@/lib/assistant/tools/names';
import { readFinancing } from '@/lib/assistant/tools/read-advisor';
import {
  readForecast,
  readHistory,
  readMonth,
  readSignals,
} from '@/lib/assistant/tools/read-company';
import {
  readVariable,
  readVariableDetail,
} from '@/lib/assistant/tools/read-variable';
import type { PulseCompanyDetails } from '@/lib/pulse/details/types';
import type { PulseCompany } from '@/lib/pulse/types';
import {
  VARIABLE_META,
  makeForecastPoint,
  makeSeriesPoint,
  makeSignal,
} from './pulse-fixtures';

/** A company with two observed months, one forecast horizon and one signal. */
function company(): PulseCompany {
  return {
    companyId: 'COMP_0001',
    groupId: 'GROUP_0147',
    monthsObserved: 2,
    month: '2026-08',
    pulse: 40,
    pulsePrev: 35,
    confidence: 0.8,
    pillars: { liquidez: 40, deuda: 40 },
    series: [
      makeSeriesPoint({
        month: '2026-07',
        pulse: 35,
        pillars: { liquidez: 30, deuda: 40 },
      }),
      makeSeriesPoint(),
    ],
    forecast: [makeForecastPoint()],
    signals: [makeSignal({ month: '2026-07' })],
  };
}

/** The detail export with one customer, one supplier and an aging ladder. */
function details(): PulseCompanyDetails {
  const months = [{ month: '2026-08', values: { cashEnd: 1 } }];
  return {
    companyId: 'COMP_0001',
    month: '2026-08',
    variables: {
      cash_days: {
        daily: [
          { day: '2026-08-01', balance: 1000 },
          { day: '2026-08-02', balance: 500 },
        ],
        dailyOutflow: 100,
        accounts: [
          {
            productId: 'P1',
            label: 'Cuenta',
            bank: 'Banco',
            type: 'cc',
            balance: 500,
          },
        ],
        months,
      },
      cash_min: {
        daily: [
          { day: '2026-08-01', balance: 1000 },
          { day: '2026-08-02', balance: 500 },
        ],
        minDay: { day: '2026-08-02', balance: 500 },
        months,
      },
      loc_util: { lines: [], months },
      loc_accel: { months },
      dpo: {
        suppliers: [
          {
            counterpartyId: 'COUNTERPARTY_00001',
            paid3m: 900,
            invoices: 3,
            dpoDays: 40,
            termsDays: 30,
            lateDays: 10,
          },
        ],
        months,
      },
      terms: { suppliers: [], months },
      dso: {
        customers: [
          {
            counterpartyId: 'COUNTERPARTY_00002',
            collected3m: 2000,
            invoices: 4,
            dsoDays: 55,
            termsDays: 30,
            lateDays: 25,
          },
          {
            counterpartyId: 'COUNTERPARTY_00003',
            collected3m: 500,
            invoices: 1,
            dsoDays: 20,
            termsDays: 30,
            lateDays: -10,
          },
        ],
        months,
      },
      ar90: {
        aging: [
          { bucket: 'al_dia', amount: 100, invoices: 1 },
          { bucket: 'mas_90', amount: 400, invoices: 2 },
        ],
        debtors: [
          {
            counterpartyId: 'COUNTERPARTY_00002',
            open: 500,
            over90: 400,
            shareOver90: 0.8,
          },
        ],
        months,
      },
      top_client: { customers: [], months },
      maturities: { products: [], months },
      network: { customers: [], months },
    },
  };
}

/** A runtime over in-memory adapters; nothing touches the disk or the API. */
function runtime(
  companyId: string | null = 'COMP_0001',
  data: PulseCompany | null = company(),
  detail: PulseCompanyDetails | null = details(),
) {
  const context: ToolContext = {
    companyId: companyId ?? undefined,
    meta: {
      pillars: [
        { key: 'liquidez', label: 'Liquidez', weight: 30 },
        { key: 'deuda', label: 'Deuda', weight: 26 },
      ],
      variables: VARIABLE_META,
    },
    sources: {
      pulse: {
        getCompany: vi.fn().mockResolvedValue(data),
        getCompanyDetails: vi.fn().mockResolvedValue(detail),
      },
      advisor: { getCompany: vi.fn().mockResolvedValue(null) },
    },
  };
  return new ToolRuntime(context);
}

describe('tool runtime', () => {
  it('names the eight tools and recognises their UI parts', () => {
    expect(ASSISTANT_TOOL_NAMES).toHaveLength(8);
    expect(isAssistantToolPartType('tool-show_chart')).toBe(true);
    expect(isAssistantToolPartType('tool-rm_rf')).toBe(false);
    expect(toolNameOf('tool-get_month')).toBe('get_month');
    expect(Object.keys(createAssistantTools(runtime().context))).toEqual([
      ...ASSISTANT_TOOL_NAMES,
    ]);
  });
  it('loads the company once per request and explains when there is none', async () => {
    const rt = runtime();
    await Promise.all([
      readHistory(rt, {}),
      readMonth(rt, {}),
      readSignals(rt),
    ]);
    expect(rt.context.sources.pulse.getCompany).toHaveBeenCalledTimes(1);
    expect(await readHistory(runtime(null), {})).toEqual({
      error: NO_COMPANY_ERROR,
    });
    expect(await readForecast(runtime('COMP_9999', null))).toEqual({
      error: UNKNOWN_COMPANY_ERROR,
    });
  });
  it('rounds figures and never returns identifiers instead of names', async () => {
    expect(round(1.256, 2)).toBe(1.26);
    expect(round(null)).toBeNull();
    const history = await readHistory(runtime(), { months: 1 });
    expect(history).toMatchObject({
      company: 'Atresmedia Labs',
      months: [{ month: '2026-08', pulse: 40, confidence: 0.8 }],
    });
    const month = await readMonth(runtime(), { month: '2026-07' });
    expect(month).toMatchObject({
      month: '2026-07',
      requestedMonthFound: true,
    });
    expect(
      (month as { variables: { known: boolean }[] }).variables.map(
        (v) => v.known,
      ),
    ).toEqual([false, true]);
  });
  it('reads forecast drivers, signals and the missing recommendation', async () => {
    const forecast = await readForecast(runtime());
    expect(forecast).toMatchObject({
      horizons: [{ horizon: 6, pulsePred: 38, delta: -1.5 }],
    });
    const signals = await readSignals(runtime());
    expect(signals).toMatchObject({
      activeAlert: { headline: 'Caída de 7 puntos en abril de 2026' },
    });
    expect(await readFinancing(runtime())).toMatchObject({
      error: 'No hay recomendaciones publicadas para esta empresa.',
    });
  });
  it('reads one variable and rejects an unknown key with the valid ones', async () => {
    const variable = await readVariable(runtime(), { variable: 'cash_days' });
    expect(variable).toMatchObject({
      variable: { label: 'Días de caja', pillar: 'Liquidez' },
      stats: { monthsWithData: 2, monthsObserved: 2 },
    });
    expect(await readVariable(runtime(), { variable: 'nope' })).toMatchObject({
      error: expect.stringContaining('cash_days, loc_util'),
    });
  });
  it('reads counterparty rankings with trade names, never identifiers', async () => {
    const detail = await readVariableDetail(runtime(), { variable: 'dso' });
    const text = JSON.stringify(detail);
    expect(text).not.toContain('COUNTERPARTY_00002');
    expect(detail).toMatchObject({
      rankings: [{ ranking: 'clientes_dso' }, { ranking: 'clientes_cobros' }],
    });
    expect(await readVariableDetail(runtime(), {})).toMatchObject({
      error: expect.stringContaining('Indica un ranking'),
    });
    expect(
      await readVariableDetail(runtime('COMP_0001', company(), null), {
        ranking: 'morosidad',
      }),
    ).toMatchObject({ error: expect.stringContaining('no está publicado') });
  });
});

describe('chart builders', () => {
  it('builds the trajectory with the boundary and the signals', async () => {
    const chart = await buildChart(runtime(), { kind: 'trayectoria' });
    expect(chart).toMatchObject({
      kind: 'trayectoria',
      company: 'Atresmedia Labs',
      boundaryIndex: 1,
      href: '/company/COMP_0001',
    });
    expect(chart.kind === 'trayectoria' && chart.points).toHaveLength(3);
    expect(chartModelOutput(chart)).toMatchObject({
      shown: true,
      kind: 'trayectoria',
      summary: expect.stringContaining('40,0'),
    });
  });
  it('orders points lost first and keeps unknown variables without a bar', async () => {
    const chart = await buildChart(runtime(), { kind: 'puntos' });
    expect(chart.kind).toBe('puntos');
    if (chart.kind !== 'puntos') return;
    expect(chart.rows.map((row) => row.key)).toEqual(['cash_days', 'loc_util']);
    expect(chart.rows[1].known).toBe(false);
    expect(chart.summary).toContain('pierde 6,3 de 12');
  });
  it('builds pillars, variables, one variable, a comparison and the drivers', async () => {
    const rt = runtime();
    expect(await buildChart(rt, { kind: 'pilares' })).toMatchObject({
      kind: 'pilares',
      pillars: [{ key: 'liquidez', last: 40, change: 10 }, { key: 'deuda' }],
    });
    expect(await buildChart(rt, { kind: 'variables' })).toMatchObject({
      kind: 'variables',
      rows: [
        { key: 'cash_days', score: 38.96 },
        { key: 'loc_util', known: false },
      ],
    });
    expect(
      await buildChart(rt, { kind: 'variable', variable: 'cash_days' }),
    ).toMatchObject({
      kind: 'variable',
      href: '/company/COMP_0001/variable/cash_days',
    });
    expect(
      await buildChart(rt, {
        kind: 'comparar',
        variables: ['cash_days', 'loc_util'],
      }),
    ).toMatchObject({
      kind: 'comparar',
      series: [{ key: 'cash_days' }, { key: 'loc_util' }],
    });
    expect(
      await buildChart(rt, { kind: 'impulsores', horizon: 6 }),
    ).toMatchObject({
      kind: 'impulsores',
      items: expect.arrayContaining([
        expect.objectContaining({
          key: 'base',
          label: 'Base del modelo',
          value: -1,
        }),
      ]),
    });
  });
  it('explains what it cannot draw instead of drawing nothing', async () => {
    expect(await buildChart(runtime(), { kind: 'variable' })).toEqual({
      kind: 'error',
      error: 'Indica una de las once variables.',
    });
    expect(
      await buildChart(runtime(), {
        kind: 'comparar',
        variables: ['cash_days'],
      }),
    ).toMatchObject({ kind: 'error' });
    expect(
      await buildChart(runtime('COMP_0001', company(), null), { kind: 'caja' }),
    ).toMatchObject({
      kind: 'error',
      error: expect.stringContaining('caja diaria'),
    });
    expect(await buildChart(runtime(null), { kind: 'trayectoria' })).toEqual({
      kind: 'error',
      error: NO_COMPANY_ERROR,
    });
    expect(chartModelOutput({ kind: 'error', error: 'x' })).toEqual({
      shown: false,
      kind: 'error',
      title: null,
      summary: 'x',
    });
  });
  it('draws the daily cash with the outflow guide or the worst day', async () => {
    const cash = await buildChart(runtime(), { kind: 'caja' });
    expect(cash).toMatchObject({
      kind: 'caja',
      guide: { value: 3000 },
      mark: null,
    });
    const worst = await buildChart(runtime(), {
      kind: 'caja',
      variable: 'cash_min',
    });
    expect(worst).toMatchObject({ kind: 'caja', mark: { day: '2026-08-02' } });
  });
  it('ranks counterparties largest first and keeps the aging ladder in order', async () => {
    const dso = buildRankingRows(details(), 'clientes_dso');
    expect(dso.rows.map((row) => row.value)).toEqual([55, 20]);
    expect(dso.rows[0].detail).toBe('Paga 25,0 días tarde');
    const aging = buildRankingRows(details(), 'antiguedad');
    expect(aging.rows.map((row) => row.label)).toEqual([
      'Al día',
      'Más de 90 días',
    ]);
    expect(aging.rows[1].color).toBe('var(--score-critical)');
    expect(
      await_(buildChart(runtime(), { kind: 'ranking', ranking: 'morosidad' })),
    ).resolves.toMatchObject({
      kind: 'ranking',
      rows: [{ valueText: '400 €' }],
    });
  });
});

/** Wraps a promise so the ranking test stays synchronous in shape. */
function await_<T>(promise: Promise<T>): Promise<T> {
  return promise;
}
