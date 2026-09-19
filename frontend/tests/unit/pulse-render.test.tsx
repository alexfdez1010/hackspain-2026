import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PulseCompanyHeader } from '@/components/pulse/company-header';
import { PulseForecastPanel } from '@/components/pulse/forecast-panel';
import { PulsePillarList } from '@/components/pulse/pillar-list';
import { PulsePortfolioTable } from '@/components/pulse/portfolio-table';
import { ScoreLegend } from '@/components/pulse/score-legend';
import { PulseVariableTable } from '@/components/pulse/variable-table';
import { buildVariableRows } from '@/lib/pulse/company-view';
import type { PulseCompany } from '@/lib/pulse/types';
import {
  makeForecastPoint,
  makeRow,
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
    expect(markup).toContain('GROUP_0147');
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

  it('links every row of the portfolio to its company view', () => {
    const markup = renderToStaticMarkup(
      <PulsePortfolioTable rows={[makeRow(), makeRow({ companyId: 'B' })]} />,
    );
    expect(markup).toContain('href="/pulse/COMP_0001"');
    expect(markup).toContain('href="/pulse/B"');
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
    expect(markup).toContain('<code>delta_raw</code> de −1,50');
  });
});
