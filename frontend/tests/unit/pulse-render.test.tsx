import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PillarSparklines } from '@/components/charts/pillar-sparklines';
import { PulseCompanyHeader } from '@/components/pulse/company-header';
import { PulseCompanyLinks } from '@/components/pulse/company-links';
import { PulseForecastPanel } from '@/components/pulse/forecast-panel';
import { PulseForecastTable } from '@/components/pulse/forecast-table';
import { PulseMonthExplorer } from '@/components/pulse/month-explorer';
import { PulseMonthTable } from '@/components/pulse/month-table';
import { PulsePillarList } from '@/components/pulse/pillar-list';
import { ScoreLegend } from '@/components/pulse/score-legend';
import { PulseVariableTable } from '@/components/pulse/variable-table';
import { buildVariableRows } from '@/lib/pulse/company-view';
import { buildForecastRows, buildMonthRows } from '@/lib/pulse/history';
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
  pulse: 32.77,
  pulsePrev: 17.88,
  confidence: 0.82,
  pillars: { liquidez: 34.33, deuda: 33.97, cobro: 54.58, pago: 51.12 },
  series: [makeSeriesPoint()],
  forecast: [makeForecastPoint()],
};

describe('PULSE views render on the server', () => {
  it('opens the company with score, change and confidence', () => {
    const markup = renderToStaticMarkup(
      <PulseCompanyHeader company={COMPANY} />,
    );
    expect(markup).toContain('32,8');
    expect(markup).toContain('+14,9');
    expect(markup).toContain('82 de 100 puntos con datos');
    expect(markup).toContain('Grupo Ebro');
    expect(markup).not.toContain('GROUP_0147');
  });

  it('publishes the weights of the pillars and of the variables', () => {
    const markup = renderToStaticMarkup(
      <ScoreLegend pillars={PILLARS} variables={VARIABLE_META} />,
    );
    expect(markup).toContain('Calidad de cobro');
    expect(markup).toContain('36 pts');
    expect(markup).toContain('Días de caja');
  });

  it('shows each pillar next to the points it owns', () => {
    const markup = renderToStaticMarkup(
      <PulsePillarList pillars={PILLARS} scores={COMPANY.pillars} />,
    );
    expect(markup).toContain('36 de 100 puntos');
    expect(markup).toContain('54,6');
  });

  it('marks a variable without evidence as «sin datos»', () => {
    const rows = buildVariableRows(VARIABLE_META, COMPANY.series[0], {
      liquidez: 'Liquidez',
      deuda: 'Deuda y servicio',
    });
    const markup = renderToStaticMarkup(<PulseVariableTable rows={rows} />);
    expect(markup).toContain('Utilización de líneas');
    expect(markup).toContain('sin datos');
    expect(markup).toContain('14,0 días');
  });

  it('decomposes the default horizon of the forecast', () => {
    const markup = renderToStaticMarkup(
      <PulseForecastPanel
        forecast={COMPANY.forecast}
        variables={VARIABLE_META}
        pulseNow={COMPANY.pulse}
      />,
    );
    expect(markup).toContain('feb 2027');
    expect(markup).toContain('20,0-55,0');
    expect(markup).toContain('Base del modelo');
    expect(markup).toContain('las 4 suman −1,50');
    expect(markup).toContain('previsto de −1,50');
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
    expect(markup).toContain('2 var. sin datos');
    expect(markup).toContain('Calidad de cobro');
    expect(markup).not.toContain('NaN');
    expect(markup.match(/2026<\/td>|2025<\/td>/g)?.length ?? 0).toBeGreaterThan(
      0,
    );
  });

  it('explains what is missing when there is no observed month', () => {
    expect(
      renderToStaticMarkup(<PulseMonthTable rows={[]} pillars={PILLARS} />),
    ).toContain('Sin meses observados');
  });

  it('names every predicted month as such, next to its band', () => {
    const rows = buildForecastRows(COMPANY.forecast, COMPANY.pulse);
    const markup = renderToStaticMarkup(
      <PulseForecastTable rows={rows} baseMonth={COMPANY.month} />,
    );
    expect(markup).toContain('feb 2027');
    expect(markup).toContain('previsto');
    expect(markup).toContain('20,0-55,0');
    expect(markup).toContain('+5,2');
  });

  it('says what a company without forecast is missing', () => {
    expect(
      renderToStaticMarkup(
        <PulseForecastTable rows={[]} baseMonth="2026-08" />,
      ),
    ).toContain('Sin previsión publicada');
  });

  it('draws one small multiple per pillar with its weight', async () => {
    const company = await source.getCompany('COMP_0051');
    const series = buildPillarSeries(PILLARS, company?.series ?? []);
    const markup = renderToStaticMarkup(<PillarSparklines series={series} />);
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
    expect(markup).toContain('82 de 100 puntos con datos');
    expect(markup).toContain('2 de 11 variables sin datos');
    expect(markup).toContain('Tramo +90 días');
    expect(markup).toContain('10,51 pts');
    expect(markup).toContain('45,64');
  });

  it('points at the recommendations and at the method of the company', () => {
    const markup = renderToStaticMarkup(
      <PulseCompanyLinks companyId="COMP_0001" />,
    );
    expect(markup).toContain('href="/company/COMP_0001/recommendations"');
    expect(markup).toContain('href="/method?company=COMP_0001"');
    expect(markup).toContain('Ver productos recomendados');
  });
});
