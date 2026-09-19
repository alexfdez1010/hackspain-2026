import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseCompanyHeader } from '@/components/pulse/company-header';
import { PulseForecastPanel } from '@/components/pulse/forecast-panel';
import { PulseForecastTable } from '@/components/pulse/forecast-table';
import { PulseMethodCards } from '@/components/pulse/method-cards';
import { PulseMonthExplorer } from '@/components/pulse/month-explorer';
import { PulseMonthTable } from '@/components/pulse/month-table';
import { PulsePillarCards } from '@/components/pulse/pillar-cards';
import { PulsePillarList } from '@/components/pulse/pillar-list';
import { PulseVariableMosaic } from '@/components/pulse/variable-mosaic';
import { buildForecastRows, buildMonthRows } from '@/lib/pulse/history';
import { buildPulseMosaic } from '@/lib/pulse/mosaic';
import { buildPillarSeries } from '@/lib/pulse/pillar-series';
import { StaticPulseSource } from '@/lib/pulse/source/static-json';
import type { PulseCompany } from '@/lib/pulse/types';
import {
  makeForecastPoint,
  makeSeriesPoint,
  VARIABLE_META,
} from './pulse-fixtures';

const PILLARS = [
  { key: 'cobro', label: 'Calidad de cobro', weight: 36 },
  { key: 'liquidez', label: 'Liquidez', weight: 26 },
  { key: 'deuda', label: 'Deuda y servicio', weight: 26 },
  { key: 'pago', label: 'Comportamiento de pago', weight: 12 },
];

const COMPANY: PulseCompany = {
  companyId: 'COMP_0001',
  groupId: 'GROUP_0147',
  monthsObserved: 8,
  month: '2026-08',
  signals: [],
  pulse: 32.77,
  pulsePrev: 17.88,
  confidence: 0.82,
  pillars: { liquidez: 34.33, deuda: 33.97, cobro: 54.58, pago: 51.12 },
  series: [makeSeriesPoint({ month: '2026-07' }), makeSeriesPoint()],
  forecast: [makeForecastPoint()],
};

describe('PULSE views render on the server', () => {
  it('opens the company with the score, the ruler and the four qualifiers', () => {
    const markup = renderToStaticMarkup(
      <PulseCompanyHeader
        company={COMPANY}
        pStress6m={0.28}
        baseRate={0.22}
        cashEnd={36_982.49}
      />,
    );
    expect(markup).toContain('32,8');
    expect(markup).toContain('PULSE del cierre de ago 2026');
    expect(markup).toContain('sobre la escala de bandas');
    expect(markup).toContain('+14,9');
    expect(markup).toContain('Desde 17,9 puntos en jul 2026');
    expect(markup).toContain('82 de 100 puntos de peso con datos');
    expect(markup).toContain('Tensión a 6 meses');
    expect(markup).toContain('Media de la cartera 22\u00a0%');
    expect(markup).toContain('Días de caja');
    expect(markup).not.toContain('NaN');
  });

  it('shows each pillar as a bar on the same scale', () => {
    const markup = renderToStaticMarkup(
      <PulsePillarList pillars={PILLARS} scores={COMPANY.pillars} />,
    );
    expect(markup).toContain('Calidad de cobro');
    expect(markup).toContain('>54,6</b>');
    expect(markup).toContain('width:54.58%');
  });

  it('decomposes the default horizon of the forecast', () => {
    const markup = renderToStaticMarkup(
      <PulseForecastPanel
        forecast={COMPANY.forecast}
        variables={VARIABLE_META}
        pulseNow={COMPANY.pulse}
      />,
    );
    expect(markup).toContain('PULSE previsto en feb 2027');
    expect(markup).toContain('20,0-55,0');
    expect(markup).toContain('Frente a los 32,8 de hoy');
    expect(markup).toContain('Base del modelo');
    expect(markup).toContain('Las 4 barras suman −1,50 puntos');
    expect(markup).toContain('el cambio previsto a +6 m');
  });
});

describe('the month-by-month view renders on the server', () => {
  const source = new StaticPulseSource();

  it('lists every observed month with its move and its cash', async () => {
    const company = await source.getCompany('COMP_0001');
    const rows = buildMonthRows(company?.series ?? []);
    const markup = renderToStaticMarkup(
      <PulseMonthTable rows={rows} pillars={PILLARS} />,
    );
    expect(markup).toContain('ago 2026');
    expect(markup).toContain('primer mes');
    expect(markup).toContain('2 sin datos');
    expect(markup).toContain('Caja fin de mes');
    expect(markup).not.toContain('NaN');
  });

  it('explains what is missing when there is no observed month', () => {
    expect(
      renderToStaticMarkup(<PulseMonthTable rows={[]} pillars={PILLARS} />),
    ).toContain('Sin meses observados');
  });

  it('names every predicted month next to its band and its move', () => {
    const rows = buildForecastRows(COMPANY.forecast, COMPANY.pulse);
    const markup = renderToStaticMarkup(
      <PulseForecastTable rows={rows} baseMonth={COMPANY.month} />,
    );
    expect(markup).toContain('feb 2027');
    expect(markup).toContain('PULSE previsto');
    expect(markup).toContain('20,0-55,0');
    expect(markup).toContain('+5,2');
    expect(markup).not.toContain('Δ previsto');
  });

  it('says what a company without forecast is missing', () => {
    expect(
      renderToStaticMarkup(
        <PulseForecastTable rows={[]} baseMonth="2026-08" />,
      ),
    ).toContain('Sin previsión publicada');
  });

  it('draws one card per pillar with its weight and its sparkline', async () => {
    const company = await source.getCompany('COMP_0051');
    const series = buildPillarSeries(PILLARS, company?.series ?? []);
    const markup = renderToStaticMarkup(<PulsePillarCards series={series} />);
    expect(markup.match(/role="img"/g)).toHaveLength(4);
    expect(markup).toContain('36 de 100 puntos');
    expect(markup).toContain('Comportamiento de pago');
    expect(markup).not.toContain('NaN');
  });

  it('opens the last observed month with its contributions', async () => {
    const company = await source.getCompany('COMP_0001');
    const { meta } = await source.getSummary();
    const markup = renderToStaticMarkup(
      <PulseMonthExplorer
        series={company?.series ?? []}
        pillars={meta.pillars}
        variables={meta.variables}
      />,
    );
    expect(markup).toContain('PULSE de ago 2026');
    expect(markup).toContain('Confianza: 82 de 100 puntos de peso con datos');
    expect(markup).toContain('Variables sin dato en ago 2026');
    expect(markup).toContain('Tramo +90 días');
    expect(markup).toContain('10,51');
    expect(markup).toContain('45,64');
  });

  it('draws the mosaic of the last close and opens its heaviest variable', async () => {
    const company = await source.getCompany('COMP_0001');
    const { meta } = await source.getSummary();
    const last = company?.series[company.series.length - 1] ?? null;
    const mosaic = buildPulseMosaic(meta.pillars, meta.variables, last);
    const markup = renderToStaticMarkup(
      <PulseVariableMosaic mosaic={mosaic} companyId="COMP_0001" />,
    );
    expect(markup).toContain('Calidad de cobro');
    expect(markup).toContain('54,6 · neutro');
    expect(markup).toContain('36 pts de peso');
    expect(markup).toContain('Tramo +90 días');
    expect(markup).toContain('2 sin datos');
    expect(markup).toContain('Peso en el modelo');
    expect(markup).toContain('Ver la variable');
    expect(markup).toMatch(/href="\/company\/COMP_0001\/variable\/\w+"/);
    expect(markup).not.toContain('NaN');
  });

  it('states the model with the weights of the export', async () => {
    const company = await source.getCompany('COMP_0001');
    const { meta } = await source.getSummary();
    const markup = renderToStaticMarkup(
      <PulseMethodCards meta={meta} company={company!} />,
    );
    expect(markup).toContain('PULSE = Σ(peso · score) / Σ(pesos con dato)');
    expect(markup).toContain('36 · 26 · 26 · 12 de 100');
    expect(markup).toContain('ene 2026 – ago 2026');
    expect(markup).toContain('6 meses, hasta feb 2027');
    expect(markup).toContain('2 de 11 variables');
    expect(markup).toContain('href="/method?company=COMP_0001"');
  });
});
